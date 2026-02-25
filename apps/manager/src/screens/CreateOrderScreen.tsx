import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Badge,
  Fab,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Remove as RemoveIcon,
  AddCircle as AddCircleIcon,
  CheckCircle as CheckCircleIcon,
  LocalBar as LocalBarIcon,
} from '@mui/icons-material';
import { getProducts } from '@shared/api/products';
import { getAllStocks } from '@shared/api/stock';
import { getCategories } from '@shared/api/categories';
import { getUserByPhone, getAllUsers, createClient } from '@shared/api/users';
import { createOrder } from '@shared/api/orders';
import { createPayment } from '@shared/api/orders';
import { getProductSupplements } from '@shared/api/product-supplements';
import { Product } from '@shared/types/product';
import SupplementDialog from '../components/orders/SupplementDialog';
import { Stock } from '@shared/types/stock';
import { Category } from '@shared/types/category';
import { OrderItem } from '@shared/types/order';
import { User } from '@shared/types/user';
import { formatPhoneNumber } from '@shared/utils/phone';
import { staggerContainer, staggerItem, slideUp, scale } from '../constants/animations';
import SectionTitle from '../components/ui/SectionTitle';
import PageTransition from '../components/ui/PageTransition';
import { designTokens } from '../design-tokens';
import SupplementSelector from '../components/products/SupplementSelector';

type WizardStep = 'products' | 'client' | 'payment';

const CreateOrderScreen: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('products');
  const [client, setClient] = useState<User | null>(null);
  const [invitedClient, setInvitedClient] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openQuantityDialog, setOpenQuantityDialog] = useState(false);
  const [openSupplementDialog, setOpenSupplementDialog] = useState(false);
  const [selectedPlatForSupplement, setSelectedPlatForSupplement] = useState<{ product: Product; itemIndex: number } | null>(null);
  const [openNewSupplementDialog, setOpenNewSupplementDialog] = useState(false);
  const [orderItemsSupplements, setOrderItemsSupplements] = useState<{ [key: number]: any[] }>({});
  const [saleUnit, setSaleUnit] = useState<'unit' | 'packet' | 'plate'>('unit');
  const [openClientDialog, setOpenClientDialog] = useState(false);
  const [openAddClientDialog, setOpenAddClientDialog] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wave'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadClients();
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      const allStocks = await getAllStocks();
      setStocks(allStocks);
    } catch (err: any) {
      console.error('Erreur lors du chargement des stocks:', err);
    }
  };

  const getProductStock = (productId: number) => {
    return stocks.find((s) => s.productId === productId);
  };

  const loadProducts = async () => {
    try {
      const allProducts = await getProducts({ isActive: true });
      const allStocks = await getAllStocks();
      
      // Mapper les stocks réels aux produits
      const productsWithStock = allProducts.map((product) => {
        const stock = allStocks.find((s) => s.productId === product.id);
        return {
          ...product,
          stockQuantity: stock ? stock.quantity : 0,
          hasStock: stock ? stock.quantity > 0 : (product.hasStock || false),
        };
      });
      
      setProducts(productsWithStock);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des produits');
    }
  };

  const loadCategories = async () => {
    try {
      const allCategories = await getCategories();
      setCategories(allCategories.filter(c => c.isActive));
    } catch (err: any) {
      console.error('Erreur lors du chargement des catégories:', err);
    }
  };

  const loadClients = async () => {
    try {
      const allUsers = await getAllUsers();
      const clientUsers = allUsers.filter((u) => u.role === 'client');
      setClients(clientUsers);
    } catch (err: any) {
      console.error('Erreur lors du chargement des clients:', err);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategoryId === null) return true;
    return product.categoryId === selectedCategoryId;
  });

  const filteredClients = clients.filter((client) => {
    if (!clientSearchTerm.trim()) return true;
    const searchLower = clientSearchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.phoneNumber.includes(clientSearchTerm)
    );
  });

  const handleProductClick = (product: Product) => {
    // Vérifier si le produit a un stock de 0 (sauf pour les plats)
    const stock = getProductStock(product.id);
    if (product.productType !== 'dish' && stock && stock.quantity === 0) {
      return; // Ne pas ouvrir le dialogue si le produit est en rupture
    }
    
    setSelectedProduct(product);
    setQuantity(1);
    
    // Si c'est un produit food avec suppléments, ouvrir le nouveau dialogue de suppléments
    if (product.productType === 'dish' && product.supplements && product.supplements.length > 0) {
      setOpenNewSupplementDialog(true);
    } else {
      setOpenQuantityDialog(true);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    // Récupérer le stock actuel du produit
    const stock = getProductStock(selectedProduct.id);

    // Vérifier le stock selon le type de produit
    if (selectedProduct.hasStock && stock && stock.quantity !== undefined) {
      try {
        // Pour cigarettes et œufs, récupérer le stock réel depuis l'API
        if (selectedProduct.productType === 'cigarette' || selectedProduct.productType === 'egg') {
          const { getStock } = await import('@shared/api/stock');
          const stock = await getStock(selectedProduct.id);
          
          if (stock) {
            let availableUnits = 0;
            if (selectedProduct.productType === 'cigarette') {
              const packets = stock.quantityPackets || 0;
              const units = stock.quantityUnits || 0;
              availableUnits = packets * (selectedProduct.conversionFactor || 20) + units;
            } else if (selectedProduct.productType === 'egg') {
              const plates = stock.quantityPlates || 0;
              const units = stock.quantityUnits || 0;
              availableUnits = plates * (selectedProduct.conversionFactor || 30) + units;
            }

            const currentInCart = orderItems
              .filter((item) => item.productId === selectedProduct.id && !item.isSupplement)
              .reduce((sum, item) => sum + item.quantity, 0);

            const requestedQuantity = saleUnit === 'packet' && selectedProduct.productType === 'cigarette'
              ? quantity * (selectedProduct.conversionFactor || 20)
              : quantity;

            if (currentInCart + requestedQuantity > availableUnits) {
              setError(
                `Stock insuffisant. Disponible: ${availableUnits - currentInCart} ${selectedProduct.productType === 'cigarette' ? 'cigarettes' : 'œufs'}`
              );
              return;
            }
          }
        } else {
          // Pour les autres produits avec stock
          const currentInCart = orderItems
            .filter((item) => item.productId === selectedProduct.id && !item.isSupplement)
            .reduce((sum, item) => sum + item.quantity, 0);

          if (stock && currentInCart + quantity > stock.quantity) {
            setError(
              `Stock insuffisant. Disponible: ${stock?.quantity || 0} - ${currentInCart}`
            );
            return;
          }
        }
      } catch (err: any) {
        console.error('Erreur lors de la vérification du stock:', err);
        // Continuer quand même, le backend vérifiera
      }
    }

    // Calculer la quantité et le prix selon l'unité de vente
    let finalQuantity = quantity;
    let finalPrice = Number(selectedProduct.price);

    if (selectedProduct.productType === 'cigarette' && saleUnit === 'packet') {
      finalQuantity = quantity;
      finalPrice = (selectedProduct.conversionFactor || 20) * Number(selectedProduct.price); // Prix du paquet
    } else if (selectedProduct.productType === 'egg') {
      // Les œufs sont toujours vendus à l'unité
      finalQuantity = quantity;
      finalPrice = Number(selectedProduct.price);
    }

    const existingItemIndex = orderItems.findIndex(
      (item) => item.productId === selectedProduct.id && !item.isSupplement
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += finalQuantity;
      updatedItems[existingItemIndex].totalPrice =
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setOrderItems(updatedItems);
    } else {
      const newItem: OrderItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: finalQuantity,
        unitPrice: finalPrice,
        totalPrice: finalQuantity * finalPrice,
      };
      setOrderItems([...orderItems, newItem]);
    }

    setOpenQuantityDialog(false);
    setSelectedProduct(null);
    setQuantity(1);
    setSaleUnit('unit');
    setError(null);
  };

  const handleAddSupplements = async (supplements: Product[]) => {
    if (!selectedPlatForSupplement) return;
    
    const updatedItems = [...orderItems];
    
    // Ajouter le plat principal
    const platItem: OrderItem = {
      productId: selectedPlatForSupplement.product.id,
      productName: selectedPlatForSupplement.product.name,
      unitPrice: selectedPlatForSupplement.product.price,
      quantity: 1,
      isSupplement: false,
      totalPrice: selectedPlatForSupplement.product.price,
    } as OrderItem;
    
    if (selectedPlatForSupplement.itemIndex >= 0) {
      updatedItems[selectedPlatForSupplement.itemIndex] = platItem;
    } else {
      updatedItems.push(platItem);
    }
    
    setOrderItems(updatedItems);
    setOpenSupplementDialog(false);
    setSelectedPlatForSupplement(null);
  };

  const handleSupplementConfirm = (quantity: number, selectedSupplements: any[]) => {
    if (!selectedPlatForSupplement) return;
    
    // Calculer le prix des suppléments pour UNE unité
    const supplementsPricePerUnit = selectedSupplements.reduce((sum: number, sup: any) => sum + (sup.supplement_price || 0), 0);
    
    // Calculer le prix total : (plat + suppléments) * quantité
    const totalPrice = (selectedPlatForSupplement.product.price + supplementsPricePerUnit) * quantity;
    
    const platItem: OrderItem = {
      productId: selectedPlatForSupplement.product.id,
      productName: selectedPlatForSupplement.product.name,
      unitPrice: selectedPlatForSupplement.product.price, // Garder le prix unitaire du plat
      quantity: quantity,
      isSupplement: false,
      totalPrice: totalPrice,
    } as OrderItem;
    
    const updatedItems = [...orderItems];
    
    if (selectedPlatForSupplement.itemIndex >= 0) {
      updatedItems[selectedPlatForSupplement.itemIndex] = platItem;
    } else {
      updatedItems.push(platItem);
    }
    
    // Multiplier les suppléments par la quantité
    const multipliedSupplements: any[] = [];
    for (let i = 0; i < quantity; i++) {
      selectedSupplements.forEach((supplement) => {
        multipliedSupplements.push({
          ...supplement,
          quantity: 1, // Chaque supplément est pour une unité
        });
      });
    }
    
    // Mettre à jour les suppléments pour cet item
    const itemIndex = selectedPlatForSupplement.itemIndex >= 0 ? selectedPlatForSupplement.itemIndex : updatedItems.length - 1;
    const newOrderItemsSupplements = { ...orderItemsSupplements };
    newOrderItemsSupplements[itemIndex] = multipliedSupplements;
    setOrderItemsSupplements(newOrderItemsSupplements);
    
    setOrderItems(updatedItems);
    setOpenSupplementDialog(false);
    setSelectedPlatForSupplement(null);
  };

  const handleNewSupplementConfirm = (quantity: number, selectedSupplements: any[]) => {
    if (!selectedProduct) return;
    
    // Calculer le prix des suppléments pour UNE unité
    const supplementsPricePerUnit = selectedSupplements.reduce((sum: number, sup: any) => sum + (sup.supplement_price || 0), 0);
    
    // Calculer le prix total : (plat + suppléments) * quantité
    const totalPrice = (selectedProduct.price + supplementsPricePerUnit) * quantity;
    
    const newItem: OrderItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      unitPrice: selectedProduct.price, // Garder le prix unitaire du plat
      quantity: quantity,
      isSupplement: false,
      totalPrice: totalPrice,
    };
    
    const newItemIndex = orderItems.length;
    setOrderItems([...orderItems, newItem]);
    
    // Multiplier les suppléments par la quantité
    const multipliedSupplements: any[] = [];
    for (let i = 0; i < quantity; i++) {
      selectedSupplements.forEach((supplement) => {
        multipliedSupplements.push({
          ...supplement,
          quantity: 1, // Chaque supplément est pour une unité
        });
      });
    }
    
    setOrderItemsSupplements({
      ...orderItemsSupplements,
      [newItemIndex]: multipliedSupplements
    });
    setOpenNewSupplementDialog(false);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    const newOrderItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newOrderItems);
    
    // Supprimer aussi les suppléments associés
    const newOrderItemsSupplements = { ...orderItemsSupplements };
    delete newOrderItemsSupplements[index];
    
    // Réindexer les suppléments restants
    const reindexedSupplements: { [key: number]: any[] } = {};
    Object.keys(newOrderItemsSupplements).forEach((key, newIndex) => {
      const oldIndex = parseInt(key);
      if (oldIndex > index) {
        reindexedSupplements[newIndex - 1] = newOrderItemsSupplements[oldIndex];
      } else {
        reindexedSupplements[newIndex] = newOrderItemsSupplements[oldIndex];
      }
    });
    
    setOrderItemsSupplements(reindexedSupplements);
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedItems = [...orderItems];
    const item = updatedItems[index];
    
    // Récupérer les suppléments actuels
    const itemSupplements = orderItemsSupplements[index] || [];
    
    // Calculer le prix des suppléments pour UNE unité
    const supplementsPricePerUnit = itemSupplements.reduce((sum: number, sup: any) => sum + (sup.supplement_price || 0), 0);
    
    // Mettre à jour la quantité et le prix total
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].totalPrice = (item.unitPrice + supplementsPricePerUnit) * newQuantity;
    
    // Multiplier les suppléments par la nouvelle quantité
    if (itemSupplements.length > 0) {
      const multipliedSupplements: any[] = [];
      for (let i = 0; i < newQuantity; i++) {
        itemSupplements.forEach((supplement: any) => {
          multipliedSupplements.push({
            ...supplement,
            quantity: 1,
          });
        });
      }
      
      const newOrderItemsSupplements = { ...orderItemsSupplements };
      newOrderItemsSupplements[index] = multipliedSupplements;
      setOrderItemsSupplements(newOrderItemsSupplements);
    }
    
    setOrderItems(updatedItems);
  };

  const handleNextToClient = () => {
    if (orderItems.length === 0) {
      setError('Veuillez ajouter au moins un produit');
      return;
    }
    setCurrentStep('client');
    setError(null);
  };

  const handleNextToPayment = () => {
    if (!client && !invitedClient) {
      setError('Veuillez sélectionner ou créer un client');
      return;
    }
    setCurrentStep('payment');
    // Initialiser le montant reçu avec le total pour espèces
    if (paymentMethod === 'cash') {
      setPaymentAmount(totalAmount.toFixed(0));
    } else {
      setPaymentAmount(''); // Wave n'a pas besoin de montant reçu
    }
    setError(null);
  };

  const handlePaymentAmountChange = (value: string) => {
    // Permettre seulement les chiffres
    const numericValue = value.replace(/[^0-9]/g, '');
    setPaymentAmount(numericValue);
  };

  const handleNumberKeyPress = (number: string) => {
    if (number === '.') {
      // Pas de décimales pour FCFA
      return;
    }
    if (number === 'backspace') {
      setPaymentAmount((prev) => prev.slice(0, -1));
      return;
    }
    setPaymentAmount((prev) => prev + number);
  };

  const handleSelectClient = (selectedClient: User) => {
    setClient(selectedClient);
    setOpenClientDialog(false);
    setClientSearchTerm('');
  };

  const handleSearchClient = async () => {
    if (!clientSearchTerm.trim()) {
      setError('Veuillez entrer un numéro de téléphone');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(clientSearchTerm);
      const foundClient = await getUserByPhone(formattedPhone);

      if (foundClient) {
        handleSelectClient(foundClient);
      } else {
        setError('Client non trouvé');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche du client');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClientName.trim() || !newClientPhone.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(newClientPhone);
      const newClient = await createClient({
        name: newClientName.trim(),
        phoneNumber: formattedPhone,
        password: 'continental123',
      });
      
      // Stocker le client invité mais ne pas l'associer à la commande
      setInvitedClient(newClient);
      setClients([...clients, newClient]);
      setOpenAddClientDialog(false);
      setNewClientName('');
      setNewClientPhone('');
      
      // Afficher un message informatif
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du client');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    // Si un client invité a été créé, utiliser un client "Inconnu" pour la commande
    // mais garder l'information du client créé
    let clientIdToUse: number;
    
    if (invitedClient && !client) {
      // Chercher ou créer un client "Inconnu"
      try {
        const unknownClient = await getUserByPhone('0000000000');
        if (unknownClient) {
          clientIdToUse = unknownClient.id;
        } else {
          // Créer un client "Inconnu" si il n'existe pas
          const newUnknownClient = await createClient({
            name: 'Inconnu',
            phoneNumber: '0000000000',
            password: 'unknown123',
          });
          clientIdToUse = newUnknownClient.id;
        }
      } catch (err: any) {
        // Si on ne peut pas créer/trouver "Inconnu", utiliser le client invité
        if (invitedClient) {
          clientIdToUse = invitedClient.id;
        } else {
          setError('Client non sélectionné');
          return;
        }
      }
    } else if (!client) {
      setError('Client non sélectionné');
      return;
    } else {
      clientIdToUse = client.id;
    }

    if (orderItems.length === 0) {
      setError('Veuillez ajouter au moins un produit');
      return;
    }

    // Calculer le montant à payer (peut être 0 si pas de paiement initial)
    const amountToPay = paymentMethod === 'wave' 
      ? totalAmount 
      : (parseInt(paymentAmount) || 0);
    
    // Permettre la création de commande même sans paiement initial
    // Le paiement pourra être effectué plus tard

    setLoading(true);
    setError(null);

    try {
      // Créer la commande avec gestion des suppléments
      console.log('[DEBUG] ===== DÉBUT CRÉATION COMMANDE =====');
      console.log('[DEBUG] clientId:', clientIdToUse);
      console.log('[DEBUG] tableNumber:', tableNumber);
      console.log('[DEBUG] orderItems count:', orderItems.length);
      console.log('[DEBUG] orderItems:', orderItems);
      console.log('[DEBUG] orderItemsSupplements:', orderItemsSupplements);
      
      // Séparer les items principaux et les suppléments
      const mainItems: OrderItem[] = [];
      const supplementItems: Array<OrderItem & { parentItemIndex?: number }> = [];
      
      console.log('[DEBUG] orderItemsSupplements avant transformation:', orderItemsSupplements);
      
      orderItems.forEach((item, index) => {
        console.log(`[DEBUG] Traitement item ${index}:`, {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          isSupplement: item.isSupplement,
          parentItemId: item.parentItemId,
        });
        
        if (item.isSupplement && item.parentItemId !== undefined) {
          // Trouver l'index du parent dans orderItems (avant séparation)
          // Le parentItemId dans le frontend est l'index du plat parent
          const parentIndex = typeof item.parentItemId === 'number' ? item.parentItemId : undefined;
          if (parentIndex !== undefined) {
            console.log(`[DEBUG] Ajout supplément ${index} avec parentIndex ${parentIndex}`);
            supplementItems.push({
              ...item,
              parentItemIndex: parentIndex, // Utiliser l'index comme référence temporaire
            });
          } else {
            console.log('[DEBUG] ERREUR: parentItemId invalide pour le supplément:', item);
          }
        } else {
          console.log(`[DEBUG] Ajout item principal ${index}:`, item.productName);
          mainItems.push(item);
        }
      });

      // Transformer les suppléments depuis orderItemsSupplements
      Object.entries(orderItemsSupplements).forEach(([parentIndex, supplements]) => {
        console.log(`[DEBUG] Traitement suppléments pour parentIndex ${parentIndex}:`, supplements);
        const parentItem = mainItems[parseInt(parentIndex)];
        const parentItemId = parentItem?.id || parseInt(parentIndex) + 1; // Utiliser l'ID réel ou fallback
        
        supplements.forEach((supplement, supIndex) => {
          console.log(`[DEBUG] Ajout supplément depuis orderItemsSupplements ${supIndex}:`, supplement);
          supplementItems.push({
            ...supplement,
            parentItemIndex: parseInt(parentIndex),
            parentItemId: parentItemId, // ← AJOUTÉ: ID réel du parent
          });
        });
      });

      console.log('[DEBUG] Après transformation - mainItems:', mainItems);
      console.log('[DEBUG] Après transformation - supplementItems:', supplementItems);

      // Créer la commande avec tous les items dans l'ordre (plats d'abord, puis suppléments)
      const allItems = [
        ...mainItems.map((item, index) => {
          const mappedItem = {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice, // Inclure le prix total correct avec suppléments
            isSupplement: false,
          };
          console.log(`[DEBUG] Mappage item principal ${index}:`, mappedItem);
          return mappedItem;
        }),
        ...supplementItems.map((item, index) => {
          const mappedItem = {
            productId: item.productId,
            productName: item.productName, // ← CORRIGÉ
            quantity: item.quantity,
            unitPrice: item.unitPrice, // ← CORRIGÉ
            totalPrice: (item.unitPrice || 0) * item.quantity, // ← CORRIGÉ
            parentItemId: item.parentItemId || (item.parentItemIndex !== undefined ? item.parentItemIndex + 1 : undefined), // ← CORRIGÉ: Vérification undefined
            isSupplement: true,
          };
          console.log(`[DEBUG] Mappage supplément ${index}:`, mappedItem);
          console.log(`[DEBUG] Vérification supplément ${index}:`, {
            productId: mappedItem.productId,
            productName: mappedItem.productName,
            quantity: mappedItem.quantity,
            unitPrice: mappedItem.unitPrice,
            totalPrice: mappedItem.totalPrice,
            parentItemId: mappedItem.parentItemId,
            isSupplement: mappedItem.isSupplement,
          });
          return mappedItem;
        }),
      ];

      console.log('[DEBUG] Main items:', mainItems);
      console.log('[DEBUG] Supplement items:', supplementItems);
      console.log('[DEBUG] All items to send:', allItems);
      
      // Validation finale avant envoi
      const invalidItems = allItems.filter(item => 
        !item.productId || 
        !item.productName || 
        !item.quantity || 
        item.unitPrice === undefined || 
        isNaN(item.totalPrice)
      );
      
      if (invalidItems.length > 0) {
        console.error('[DEBUG] ERREUR: Items invalides détectés:', invalidItems);
        throw new Error(`Données invalides détectées: ${invalidItems.length} items invalides`);
      }
      
      console.log('[DEBUG] Validation OK - Envoi de la commande...');
      console.log('[DEBUG] Données envoyées:', {
        clientId: clientIdToUse,
        items: allItems,
        tableNumber: tableNumber || undefined,
      });

      const newOrder = await createOrder({
        clientId: clientIdToUse,
        items: allItems,
        tableNumber: tableNumber || undefined,
      });

      console.log('[DEBUG] Commande créée avec succès:', newOrder);

      // Créer le paiement (partiel ou total)
      if (amountToPay > 0) {
        console.log('[DEBUG] Création paiement:', {
          orderId: newOrder.id,
          amount: amountToPay,
          method: paymentMethod,
        });
        await createPayment({
          orderId: newOrder.id,
          amount: amountToPay,
          method: paymentMethod,
        });
        console.log('[DEBUG] Paiement créé avec succès');
      }

      setCreatedOrderId(newOrder.id);
      setShowSuccess(true);
      setLoading(false);
      console.log('[DEBUG] ===== FIN CRÉATION COMMANDE - SUCCÈS =====');
    } catch (err: any) {
      console.error('[DEBUG] ===== ERREUR CRÉATION COMMANDE =====');
      console.error('[DEBUG] Erreur:', err);
      console.error('[DEBUG] Message erreur:', err.message);
      console.error('[DEBUG] Stack trace:', err.stack);
      
      // Si c'est une erreur HTTP, essayer de parser la réponse
      if (err.response) {
        console.error('[DEBUG] Response status:', err.response.status);
        console.error('[DEBUG] Response data:', err.response.data);
      } else if (err.request) {
        console.error('[DEBUG] Request:', err.request);
      }
      
      setError(err.message || 'Erreur lors de la création de la commande');
      setLoading(false);
      console.log('[DEBUG] ===== FIN ERREUR CRÉATION COMMANDE =====');
    }
  };

  // Calculer le montant total en prenant en compte les suppléments
  const totalAmount = orderItems.reduce((sum, item) => {
    // Le prix total de l'item inclut déjà les suppléments multipliés par la quantité
    return sum + item.totalPrice;
  }, 0);
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const steps = [
    { label: 'Produits', step: 'products' as WizardStep },
    { label: 'Client', step: 'client' as WizardStep },
    { label: 'Paiement', step: 'payment' as WizardStep },
  ];

  const currentStepIndex = steps.findIndex((s) => s.step === currentStep);

  return (
    <PageTransition>
      <Box sx={{ pb: orderItems.length > 0 ? { xs: 40, sm: 30 } : 10 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton
            onClick={() => navigate('/orders')}
            sx={{
              mr: 2,
              color: '#DC143C',
              '&:hover': {
                backgroundColor: 'rgba(220, 20, 60, 0.1)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <SectionTitle title="Nouvelle commande" />
        </Box>
      </motion.div>

      {/* Stepper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            backgroundColor: '#F5F5F5',
          }}
        >
          <Stepper activeStep={currentStepIndex} alternativeLabel>
            {steps.map((step) => (
              <Step key={step.step}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
              backgroundColor: '#FFEBEE',
              color: '#DC143C',
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </motion.div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 'products' && (
          <motion.div
            key="products"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Category Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#000000' }}>
                Catégories
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="Toutes"
                  onClick={() => setSelectedCategoryId(null)}
                  sx={{
                    bgcolor: selectedCategoryId === null ? '#DC143C' : 'grey.300',
                    color: selectedCategoryId === null ? 'white' : 'black',
                    cursor: 'pointer',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: selectedCategoryId === null ? '#B71C1C' : 'grey.400',
                    },
                  }}
                />
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.name}
                    onClick={() => setSelectedCategoryId(category.id)}
                    sx={{
                      bgcolor: selectedCategoryId === category.id ? '#DC143C' : 'grey.300',
                      color: selectedCategoryId === category.id ? 'white' : 'black',
                      cursor: 'pointer',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: selectedCategoryId === category.id ? '#B71C1C' : 'grey.400',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Products Grid */}
            <Grid container spacing={2} sx={{ mb: orderItems.length > 0 ? { xs: 25, sm: 20 } : 0 }}>
              {filteredProducts.map((product) => {
                // Construire l'URL de l'image correctement
                const getImageUrl = (imageUrl?: string) => {
                  if (!imageUrl) return null;
                  if (imageUrl.startsWith('http')) return imageUrl;
                  // Les images sont servies directement depuis le serveur, pas via /api
                  // @ts-ignore - Vite injects import.meta.env at build time
                  const BASE_URL = (import.meta as any)?.env?.VITE_API_URL 
                    ? (import.meta as any).env.VITE_API_URL.replace('/api', '')
                    : 'http://localhost:3002';
                  // S'assurer que imageUrl commence par /
                  const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
                  return `${BASE_URL}${cleanImageUrl}`;
                };
                const imageUrl = getImageUrl(product.imageUrl);
                
                return (
                <Grid item xs={6} key={product.id}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        borderRadius: 3,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        '&:hover': {
                          boxShadow: '0 4px 16px rgba(220, 20, 60, 0.2)',
                          transform: 'translateY(-4px)',
                        },
                      }}
                      onClick={() => handleProductClick(product)}
                    >
                      {imageUrl ? (
                        <Box sx={{ position: 'relative', width: '100%', height: 120, overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                          <CardMedia
                            component="img"
                            image={imageUrl}
                            alt={product.name}
                            sx={{ 
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            onError={(e: any) => {
                              // Si l'image ne charge pas, masquer l'élément
                              e.target.style.display = 'none';
                            }}
                          />
                          {getProductStock(product.id) && product.productType !== 'dish' && (
                            <Chip
                              label={`Stock: ${getProductStock(product.id)?.quantity || 0}`}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: getProductStock(product.id)?.quantity === 0 ? '#FFEBEE' : '#E8F5E9',
                                color: getProductStock(product.id)?.quantity === 0 ? '#C62828' : '#2E7D32',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 24,
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                              }}
                            />
                          )}
                          {getProductStock(product.id) && product.productType !== 'dish' && getProductStock(product.id)?.quantity === 0 && (
                            <Chip
                              label="Rupture"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 36,
                                right: 8,
                                bgcolor: '#FF5252',
                                color: '#FFFFFF',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 20,
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                              }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 120,
                            backgroundColor: '#F5F5F5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px 12px 0 0',
                          }}
                        >
                          <LocalBarIcon sx={{ fontSize: 64, color: '#CCCCCC' }} />
                          <LocalBarIcon sx={{ fontSize: 64, color: '#CCCCCC' }} />
                          {getProductStock(product.id) && product.productType !== 'dish' && (
                            <Chip
                              label={`Stock: ${getProductStock(product.id)?.quantity || 0}`}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: getProductStock(product.id)?.quantity === 0 ? '#FFEBEE' : '#E8F5E9',
                                color: getProductStock(product.id)?.quantity === 0 ? '#C62828' : '#2E7D32',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 24,
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                              }}
                            />
                          )}
                          {getProductStock(product.id) && product.productType !== 'dish' && getProductStock(product.id)?.quantity === 0 && (
                            <Chip
                              label="Rupture"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 36,
                                right: 8,
                                bgcolor: '#FF5252',
                                color: '#FFFFFF',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 20,
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                              }}
                            />
                          )}
                        </Box>
                      )}
                      <CardContent sx={{ flexGrow: 1, p: 1.5, backgroundColor: '#FFFFFF' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: '#000000',
                            mb: 0.5,
                            fontSize: '1rem',
                          }}
                        >
                          {product.name}
                        </Typography>
                        {product.description && (
                          <Typography
                            variant="body2"
                            sx={{ color: '#666666', mb: 1, fontSize: '0.875rem' }}
                            noWrap
                          >
                            {product.description}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 'auto',
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 700, color: '#DC143C', fontSize: '0.9375rem' }}
                          >
                            {Number(product.price).toFixed(0)} FCFA
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                );
              })}
            </Grid>

            {filteredProducts.length === 0 && (
              <Box
                sx={{
                  py: 8,
                  textAlign: 'center',
                  color: '#666666',
                }}
              >
                <Typography variant="h6">Aucun produit disponible</Typography>
              </Box>
            )}

            {/* Cart Card - positioned after products */}
            {orderItems.length > 0 && (
              <Paper
                sx={{
                  position: 'sticky',
                  bottom: { xs: 80, sm: 24 },
                  mt: 3,
                  p: 2,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 3,
                  border: '1px solid #E0E0E0',
                  zIndex: 999,
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Badge badgeContent={totalItems} color="error">
                        <CartIcon sx={{ fontSize: 24, color: '#DC143C' }} />
                      </Badge>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
                        Panier
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#DC143C' }}>
                      {totalAmount.toFixed(0)} FCFA
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                    {orderItems.map((item, index) => {
                      const isSupplement = item.isSupplement;
                      const isPlat = products.find(p => p.id === item.productId)?.productType === 'dish';
                      const itemSupplements = orderItemsSupplements[index] || [];
                      
                      return (
                        <Box key={index}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 1,
                              pl: isSupplement ? 3 : 0,
                              borderBottom: index < orderItems.length - 1 ? '1px solid #F5F5F5' : 'none',
                              backgroundColor: isSupplement ? '#F9F9F9' : 'transparent',
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {isSupplement && (
                                  <Typography variant="caption" sx={{ color: '#bd0f3b' }}>
                                    + 
                                  </Typography>
                                )}
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#000000', mb: 0.25 }}>
                                  {item.productName}
                                </Typography>
                                {/* Afficher les suppléments si c'est un plat */}
                                {isPlat && itemSupplements.length > 0 && (
                                  <Box sx={{ mt: 0.5 }}>
                                    {/* Grouper les suppléments par nom et compter les quantités */}
                                    {(() => {
                                      const supplementCounts: { [key: string]: { count: number; price: number } } = {};
                                      
                                      itemSupplements.forEach((sup: any) => {
                                        const name = sup.supplementName;
                                        if (supplementCounts[name]) {
                                          supplementCounts[name].count += 1;
                                        } else {
                                          supplementCounts[name] = {
                                            count: 1,
                                            price: sup.supplementPrice || 0
                                          };
                                        }
                                      });
                                      
                                      return Object.entries(supplementCounts).map(([name, info]) => (
                                        <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                                          <Typography variant="caption" sx={{ color: '#bd0f3b', fontWeight: 700 }}>
                                            +
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                                            {name}
                                          </Typography>
                                          {info.count > 1 && (
                                            <Chip
                                              label={`×${info.count}`}
                                              size="small"
                                              sx={{
                                                height: 14,
                                                fontSize: '0.55rem',
                                                backgroundColor: '#bd0f3b',
                                                color: '#FFFFFF',
                                                fontWeight: 600,
                                              }}
                                            />
                                          )}
                                        </Box>
                                      ));
                                    })()}
                                  </Box>
                                )}
                              </Box>
                              <Typography variant="caption" sx={{ color: '#666666' }}>
                                {item.quantity} × {item.unitPrice && !isNaN(item.unitPrice) ? Number(item.unitPrice).toFixed(0) : '0'} FCFA
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {!isSupplement && (
                                <>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                                    sx={{
                                      color: '#DC143C',
                                      '&:hover': {
                                        backgroundColor: 'rgba(220, 20, 60, 0.1)',
                                      },
                                    }}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#000000', minWidth: 24, textAlign: 'center' }}>
                                    {item.quantity}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                                    sx={{
                                      color: '#DC143C',
                                      '&:hover': {
                                        backgroundColor: 'rgba(220, 20, 60, 0.1)',
                                      },
                                    }}
                                  >
                                    <AddCircleIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                              {isSupplement && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveItem(index)}
                                  sx={{
                                    color: '#DC143C',
                                    ml: 0.5,
                                    '&:hover': {
                                      backgroundColor: 'rgba(220, 20, 60, 0.1)',
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                              {!isSupplement && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveItem(index)}
                                  sx={{
                                    color: '#DC143C',
                                    ml: 0.5,
                                    '&:hover': {
                                      backgroundColor: 'rgba(220, 20, 60, 0.1)',
                                    },
                                  }}
                                  title="Supprimer l'article"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleNextToClient}
                  sx={{
                    backgroundColor: '#DC143C',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    borderRadius: 2,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: '#B71C1C',
                    },
                  }}
                >
                  Suivant
                </Button>
              </Paper>
            )}
          </motion.div>
        )}

        {currentStep === 'client' && (
          <motion.div
            key="client"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {!client ? (
              <Box>
                {/* Search Bar */}
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    placeholder="Rechercher par nom, prénom ou numéro de téléphone..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        backgroundColor: '#FFFFFF',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#666666' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Clients Grid */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {filteredClients.map((clientItem) => (
                    <Grid item xs={12} sm={6} md={4} key={clientItem.id}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          sx={{
                            cursor: 'pointer',
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#F5F5F5',
                            '&:hover': {
                              boxShadow: '0 4px 16px rgba(220, 20, 60, 0.2)',
                              transform: 'translateY(-4px)',
                              backgroundColor: '#EEEEEE',
                            },
                          }}
                          onClick={() => handleSelectClient(clientItem)}
                        >
                          <CardContent sx={{ p: 2.5 }}>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, color: '#000000', mb: 1 }}
                            >
                              {clientItem.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: '#666666' }}
                            >
                              {clientItem.phoneNumber}
                            </Typography>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>

                {/* Add Client Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setOpenAddClientDialog(true)}
                    sx={{
                      borderColor: '#DC143C',
                      color: '#DC143C',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      '&:hover': {
                        borderColor: '#B71C1C',
                        backgroundColor: 'rgba(220, 20, 60, 0.05)',
                      },
                    }}
                  >
                    Ajouter un client
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => {
                      // Inviter un client (créer avec mot de passe par défaut)
                      setOpenAddClientDialog(true);
                    }}
                    sx={{
                      color: '#666666',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                    }}
                  >
                    Inviter
                  </Button>
                </Box>

                {filteredClients.length === 0 && clientSearchTerm && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" sx={{ color: '#666666', mb: 2 }}>
                      Aucun client trouvé
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                {invitedClient && (
                  <Alert 
                    severity="info" 
                    sx={{ mb: 3, borderRadius: 2 }}
                    icon={<PersonAddIcon />}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Client invité créé : {invitedClient.name} ({invitedClient.phoneNumber})
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666666' }}>
                      La commande sera créée avec un client "Inconnu", mais les informations du client invité sont enregistrées.
                    </Typography>
                  </Alert>
                )}
                {client && (
                  <Card
                    sx={{
                      mb: 3,
                      borderRadius: 3,
                      backgroundColor: '#E8F5E9',
                      border: '2px solid #4CAF50',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 40 }} />
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
                              {client.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666666' }}>
                              {client.phoneNumber}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          size="small"
                          onClick={() => setClient(null)}
                          sx={{ color: '#DC143C', fontWeight: 600 }}
                        >
                          Changer
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setCurrentStep('products')}
                    sx={{
                      borderColor: '#666666',
                      color: '#666666',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 4,
                    }}
                  >
                    Retour
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNextToPayment}
                    sx={{
                      backgroundColor: '#DC143C',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 4,
                      '&:hover': {
                        backgroundColor: '#B71C1C',
                      },
                    }}
                  >
                    Suivant →
                  </Button>
                </Box>
              </Box>
            )}
          </motion.div>
        )}

        {currentStep === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
           

            {/* Récapitulatif du panier */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#F8F9FA', borderRadius: 2, border: '1px solid #E0E0E0' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: designTokens.colors.text.primary }}>
                Récapitulatif de la commande
              </Typography>
              
              {orderItems.map((item, index) => {
                const isSupplement = item.isSupplement;
                const itemSupplements = orderItemsSupplements[index] || [];
                
                return (
                  <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < orderItems.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#000000', mb: 0.5 }}>
                          {item.productName}
                        </Typography>
                        
                        {/* Afficher les suppléments si c'est un plat */}
                        {itemSupplements.length > 0 && (
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem', fontWeight: 600, mb: 1, display: 'block' }}>
                              Suppléments:
                            </Typography>
                            {/* Grouper les suppléments par nom et compter les quantités */}
                            {(() => {
                              const supplementCounts: { [key: string]: { count: number; price: number } } = {};
                              
                              itemSupplements.forEach((sup: any) => {
                                const name = sup.supplementName;
                                if (supplementCounts[name]) {
                                  supplementCounts[name].count += 1;
                                } else {
                                  supplementCounts[name] = {
                                    count: 1,
                                    price: sup.supplementPrice || 0
                                  };
                                }
                              });
                              
                              return Object.entries(supplementCounts).map(([name, info]) => (
                                <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: '#bd0f3b', fontWeight: 700 }}>
                                    +
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                                    {name}
                                  </Typography>
                                  {info.count > 1 && (
                                    <Chip
                                      label={`×${info.count}`}
                                      size="small"
                                      sx={{
                                        height: 16,
                                        fontSize: '0.6rem',
                                        backgroundColor: '#bd0f3b',
                                        color: '#FFFFFF',
                                        fontWeight: 600,
                                      }}
                                    />
                                  )}
                                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.65rem' }}>
                                    ({(info.price * info.count).toFixed(0)} FCFA)
                                  </Typography>
                                </Box>
                              ));
                            })()}
                          </Box>
                        )}
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC143C' }}>
                          {item.quantity} × {item.unitPrice && !isNaN(item.unitPrice) ? Number(item.unitPrice).toFixed(0) : '0'} FCFA
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              
              <Box sx={{ mt: 2, pt: 2, borderTop: '2px solid #E0E0E0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: designTokens.colors.text.primary }}>
                    Total: {totalAmount.toFixed(0)} FCFA
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Méthode de paiement */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: designTokens.colors.text.primary }}>
                Moyen de paiement
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card
                    onClick={() => {
                      setPaymentMethod('cash');
                      setPaymentAmount(totalAmount.toFixed(0)); // Initialiser avec le total
                    }}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderRadius: designTokens.borderRadius.medium,
                      border: `2px solid ${paymentMethod === 'cash' ? designTokens.colors.primary.main : '#E0E0E0'}`,
                      backgroundColor: paymentMethod === 'cash' ? `${designTokens.colors.primary.main}10` : '#FFFFFF',
                      transition: designTokens.transitions.normal,
                      '&:hover': {
                        borderColor: designTokens.colors.primary.main,
                        transform: 'translateY(-2px)',
                        boxShadow: designTokens.shadows.hover,
                      },
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: designTokens.colors.text.primary }}>
                        Espèces
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card
                    onClick={() => {
                      setPaymentMethod('wave');
                      setPaymentAmount(''); // Réinitialiser le montant pour Wave
                    }}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderRadius: designTokens.borderRadius.medium,
                      border: `2px solid ${paymentMethod === 'wave' ? designTokens.colors.primary.main : '#E0E0E0'}`,
                      backgroundColor: paymentMethod === 'wave' ? `${designTokens.colors.primary.main}10` : '#FFFFFF',
                      transition: designTokens.transitions.normal,
                      '&:hover': {
                        borderColor: designTokens.colors.primary.main,
                        transform: 'translateY(-2px)',
                        boxShadow: designTokens.shadows.hover,
                      },
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: designTokens.colors.text.primary }}>
                        Wave
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Montant reçu */}
            {paymentMethod === 'cash' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: designTokens.colors.text.primary }}>
                  Montant reçu
                </Typography>
                <TextField
                  fullWidth
                  value={paymentAmount}
                  onChange={(e) => handlePaymentAmountChange(e.target.value)}
                  placeholder="0"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      borderRadius: designTokens.borderRadius.medium,
                    },
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
                  }}
                />

                {/* Clavier numérique */}
                <Grid container spacing={1}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Grid item xs={4} key={num}>
                      <Button
                        variant="outlined"
                        onClick={() => handleNumberKeyPress(num.toString())}
                        sx={{
                          height: 60,
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          borderColor: '#E0E0E0',
                          color: designTokens.colors.text.primary,
                          '&:hover': {
                            borderColor: designTokens.colors.primary.main,
                            backgroundColor: `${designTokens.colors.primary.main}10`,
                          },
                        }}
                      >
                        {num}
                      </Button>
                    </Grid>
                  ))}
                  <Grid item xs={4}>
                    <Button
                      variant="outlined"
                      onClick={() => handleNumberKeyPress('backspace')}
                      sx={{
                        height: 60,
                        fontSize: '1.2rem',
                        borderColor: '#E0E0E0',
                        color: designTokens.colors.text.primary,
                        '&:hover': {
                          borderColor: designTokens.colors.status.error,
                          backgroundColor: `${designTokens.colors.status.error}10`,
                        },
                      }}
                    >
                      ⌫
                    </Button>
                  </Grid>
                  <Grid item xs={4}>
                    <Button
                      variant="outlined"
                      onClick={() => setPaymentAmount(totalAmount.toFixed(0))}
                      sx={{
                        height: 60,
                        fontSize: '0.9rem',
                        borderColor: '#E0E0E0',
                        color: designTokens.colors.text.primary,
                        '&:hover': {
                          borderColor: designTokens.colors.primary.main,
                          backgroundColor: `${designTokens.colors.primary.main}10`,
                        },
                      }}
                    >
                      Total
                    </Button>
                  </Grid>
                  <Grid item xs={4}>
                    <Button
                      variant="outlined"
                      onClick={() => handleNumberKeyPress('0')}
                      sx={{
                        height: 60,
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        borderColor: '#E0E0E0',
                        color: designTokens.colors.text.primary,
                        '&:hover': {
                          borderColor: designTokens.colors.primary.main,
                          backgroundColor: `${designTokens.colors.primary.main}10`,
                        },
                      }}
                    >
                      0
                    </Button>
                  </Grid>
                </Grid>

                {/* Rendu monnaie */}
                {parseInt(paymentAmount) > totalAmount && (
                  <Paper
                    sx={{
                      p: 2,
                      mt: 2,
                      borderRadius: designTokens.borderRadius.medium,
                      backgroundColor: `${designTokens.colors.status.success}15`,
                      border: `1px solid ${designTokens.colors.status.success}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: designTokens.colors.text.primary }}>
                        Rendu monnaie
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: designTokens.colors.status.success,
                        }}
                      >
                        {(parseInt(paymentAmount) - totalAmount).toFixed(0)} FCFA
                      </Typography>
                    </Box>
                  </Paper>
                )}
              </Box>
            )}

            {/* Boutons navigation */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => setCurrentStep('client')}
                sx={{
                  borderColor: designTokens.colors.text.secondary,
                  color: designTokens.colors.text.secondary,
                  fontWeight: 600,
                  borderRadius: designTokens.borderRadius.medium,
                  px: 4,
                }}
              >
                Précédent
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateOrder}
                disabled={loading}
                sx={{
                  backgroundColor: designTokens.colors.primary.main,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: designTokens.borderRadius.medium,
                  px: 4,
                  '&:hover': {
                    backgroundColor: designTokens.colors.primary.dark,
                  },
                  '&:disabled': {
                    backgroundColor: '#CCCCCC',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
                ) : (
                  `Confirmer la commande ${paymentMethod === 'cash' && parseInt(paymentAmount) > 0 && parseInt(paymentAmount) < totalAmount ? '(partiel)' : ''} ✔`
                )}
              </Button>
            </Box>

            {/* Avertissement paiement partiel */}
            {paymentMethod === 'cash' && parseInt(paymentAmount) > 0 && parseInt(paymentAmount) < totalAmount && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: designTokens.borderRadius.medium }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Paiement partiel
                </Typography>
                <Typography variant="caption">
                  Reste à payer : {(totalAmount - parseInt(paymentAmount)).toFixed(0)} FCFA
                </Typography>
              </Alert>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quantity Dialog */}
      <Dialog
        open={openQuantityDialog}
        onClose={() => setOpenQuantityDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            backgroundColor: '#8B7355',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#FFFFFF', pb: 1 }}>
          {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {/* Sélection d'unité pour cigarettes */}
            {selectedProduct?.productType === 'cigarette' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#FFFFFF', mb: 1 }}>
                  Vendre par:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Button
                    variant={saleUnit === 'unit' ? 'contained' : 'outlined'}
                    onClick={() => setSaleUnit('unit')}
                    size="small"
                    sx={{
                      bgcolor: saleUnit === 'unit' ? '#DC143C' : 'transparent',
                      color: '#FFFFFF',
                      borderColor: '#FFFFFF',
                      '&:hover': { bgcolor: saleUnit === 'unit' ? '#B71C1C' : 'rgba(255, 255, 255, 0.1)' },
                    }}
                  >
                    Unité (100 FCFA)
                  </Button>
                  <Button
                    variant={saleUnit === 'packet' ? 'contained' : 'outlined'}
                    onClick={() => setSaleUnit('packet')}
                    size="small"
                    sx={{
                      bgcolor: saleUnit === 'packet' ? '#DC143C' : 'transparent',
                      color: '#FFFFFF',
                      borderColor: '#FFFFFF',
                      '&:hover': { bgcolor: saleUnit === 'packet' ? '#B71C1C' : 'rgba(255, 255, 255, 0.1)' },
                    }}
                  >
                    Paquet ({(selectedProduct.conversionFactor || 20) * Number(selectedProduct.price)} FCFA)
                  </Button>
                </Box>
              </Box>
            )}

            <Typography variant="h5" sx={{ fontWeight: 700, color: '#FFD700', mb: 3 }}>
              {selectedProduct ? (
                saleUnit === 'packet' && selectedProduct.productType === 'cigarette'
                  ? `${(selectedProduct.conversionFactor || 20) * Number(selectedProduct.price)} FCFA`
                  : `${Number(selectedProduct.price).toFixed(0)} FCFA`
              ) : '0'} FCFA
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <IconButton
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                }}
              >
                <RemoveIcon />
              </IconButton>
              <Typography variant="h4" sx={{ fontWeight: 700, minWidth: 60, color: '#FFFFFF' }}>
                {quantity}
              </Typography>
              <IconButton
                onClick={() => setQuantity(quantity + 1)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                }}
              >
                <AddCircleIcon />
              </IconButton>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 3, color: '#FFFFFF' }}>
              Total: {(() => {
                if (!selectedProduct) return '0';
                const unitPrice = saleUnit === 'packet' && selectedProduct.productType === 'cigarette'
                  ? (selectedProduct.conversionFactor || 20) * Number(selectedProduct.price)
                  : Number(selectedProduct.price);
                return (unitPrice * quantity).toFixed(0);
              })()} FCFA
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setOpenQuantityDialog(false)}
            sx={{ color: '#FFFFFF', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleAddToCart}
            variant="contained"
            sx={{
              backgroundColor: '#DC143C',
              color: '#FFFFFF',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#B71C1C',
              },
            }}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Supplement Selector Dialog */}
      {selectedPlatForSupplement && (
        <SupplementSelector
          productId={selectedPlatForSupplement.product.id}
          productName={selectedPlatForSupplement.product.name}
          onSupplementsSelected={handleAddSupplements}
          onClose={() => {
            setOpenSupplementDialog(false);
            setSelectedPlatForSupplement(null);
          }}
          open={openSupplementDialog}
        />
      )}

      {/* Nouveau Dialogue de Suppléments */}
      {selectedProduct && selectedProduct.productType === 'dish' && (
        <SupplementDialog
          open={openNewSupplementDialog}
          product={selectedProduct}
          onConfirm={handleNewSupplementConfirm}
          onClose={() => {
            setOpenNewSupplementDialog(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Add Client Dialog */}
      <Dialog
        open={openAddClientDialog}
        onClose={() => setOpenAddClientDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            backgroundColor: '#FAFAFA',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#000000' }}>
          Ajouter un client
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#FAFAFA' }}>
          <TextField
            fullWidth
            label="Nom complet"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <TextField
            fullWidth
            label="Numéro de téléphone"
            value={newClientPhone}
            onChange={(e) => setNewClientPhone(e.target.value)}
            margin="normal"
            placeholder="0612345678"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            Le mot de passe par défaut sera <strong>continental123</strong>. Le client pourra
            télécharger l'application et se connecter avec son numéro et ce mot de passe.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenAddClientDialog(false)}
            sx={{ color: '#666666', fontWeight: 600 }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleAddClient}
            variant="contained"
            disabled={loading || !newClientName.trim() || !newClientPhone.trim()}
            sx={{
              backgroundColor: '#DC143C',
              color: '#FFFFFF',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#B71C1C',
              },
              '&:disabled': {
                backgroundColor: '#CCCCCC',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
            ) : (
              'Créer'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de succès */}
      <Dialog
        open={showSuccess}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: designTokens.borderRadius.large,
            backgroundColor: designTokens.colors.background.paper,
            textAlign: 'center',
            p: 4,
          },
        }}
      >
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <CheckCircleIcon
              sx={{
                fontSize: 80,
                color: designTokens.colors.status.success,
                mb: 2,
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: designTokens.colors.text.primary }}>
              Succès !
            </Typography>
            <Typography variant="body1" sx={{ color: designTokens.colors.text.secondary, mb: 3 }}>
              Commande #{createdOrderId} créée avec succès
            </Typography>

            {/* Détails de la commande */}
            <Paper
              sx={{
                p: 2,
                mb: 3,
                borderRadius: designTokens.borderRadius.medium,
                backgroundColor: designTokens.colors.background.default,
              }}
            >
              {tableNumber && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
                    TABLE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: designTokens.colors.text.primary }}>
                    {tableNumber}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
                  HEURE
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: designTokens.colors.text.primary }}>
                  {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              
              {/* Récapitulatif détaillé de la commande */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: designTokens.colors.text.primary }}>
                  Récapitulatif de la commande
                </Typography>
                
                {orderItems.map((item, index) => {
                  const itemSupplements = orderItemsSupplements[index] || [];
                  return (
                    <Box key={index} sx={{ mb: 1, pb: 1, borderBottom: index < orderItems.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#000000', mb: 0.5 }}>
                            {item.productName}
                          </Typography>
                          
                          {/* Afficher les suppléments si c'est un plat */}
                          {itemSupplements.length > 0 && (
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                Suppléments: {itemSupplements.map((sup: any) => sup.supplementName).join(', ')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC143C' }}>
                            {item.quantity} × {item.unitPrice && !isNaN(item.unitPrice) ? Number(item.unitPrice).toFixed(0) : '0'} FCFA
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: designTokens.colors.text.primary }}>
                  Total
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: designTokens.colors.status.success,
                  }}
                >
                  {totalAmount.toFixed(0)} FCFA
                </Typography>
              </Box>
              
              {/* Montant restant à payer */}
              {paymentMethod === 'cash' && parseInt(paymentAmount) < totalAmount && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#FFF3CD', borderRadius: 2, border: '1px solid #FFE082' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#856404', textAlign: 'center' }}>
                    Reste à payer : {(totalAmount - parseInt(paymentAmount)).toFixed(0)} FCFA
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Boutons d'action */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setShowSuccess(false);
                  setCreatedOrderId(null);
                  setOrderItems([]);
                  setClient(null);
                  setInvitedClient(null);
                  setTableNumber('');
                  setPaymentAmount('');
                  setCurrentStep('products');
                  navigate('/orders');
                }}
                sx={{
                  backgroundColor: designTokens.colors.status.success,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  borderRadius: designTokens.borderRadius.medium,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: designTokens.colors.secondary.dark,
                  },
                }}
              >
                Retour au tableau de bord
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  window.print();
                }}
                sx={{
                  borderColor: designTokens.colors.text.secondary,
                  color: designTokens.colors.text.primary,
                  fontWeight: 600,
                  borderRadius: designTokens.borderRadius.medium,
                  py: 1.5,
                }}
              >
                Imprimer le reçu
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      </Box>
    </PageTransition>
  );
};

export default CreateOrderScreen;
