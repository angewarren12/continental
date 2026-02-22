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
import { Product } from '@shared/types/product';
import { Category } from '@shared/types/category';
import { OrderItem } from '@shared/types/order';
import { User } from '@shared/types/user';
import { formatPhoneNumber } from '@shared/utils/phone';
import { staggerContainer, staggerItem, slideUp, scale } from '../constants/animations';
import SectionTitle from '../components/ui/SectionTitle';
import PageTransition from '../components/ui/PageTransition';
import { designTokens } from '../design-tokens';

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

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadClients();
  }, []);

  const loadProducts = async () => {
    try {
      const allProducts = await getProducts({ isActive: true });
      const allStocks = await getAllStocks();
      
      // Mapper les stocks réels aux produits
      const productsWithStock = allProducts.map((product) => {
        const stock = allStocks.find((s) => s.productId === product.id);
        return {
          ...product,
          stockQuantity: stock ? stock.quantity : (product.stockQuantity || 0),
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
    setSelectedProduct(product);
    setQuantity(1);
    setOpenQuantityDialog(true);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    if (selectedProduct.hasStock && selectedProduct.stockQuantity !== undefined) {
      const currentInCart = orderItems
        .filter((item) => item.productId === selectedProduct.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (currentInCart + quantity > selectedProduct.stockQuantity) {
        setError(
          `Stock insuffisant. Disponible: ${selectedProduct.stockQuantity - currentInCart}`
        );
        return;
      }
    }

    const existingItemIndex = orderItems.findIndex(
      (item) => item.productId === selectedProduct.id
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].totalPrice =
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setOrderItems(updatedItems);
    } else {
      const newItem: OrderItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        unitPrice: Number(selectedProduct.price),
        totalPrice: quantity * Number(selectedProduct.price),
      };
      setOrderItems([...orderItems, newItem]);
    }

    setOpenQuantityDialog(false);
    setSelectedProduct(null);
    setQuantity(1);
    setError(null);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedItems = [...orderItems];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].totalPrice = newQuantity * updatedItems[index].unitPrice;
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
      // Créer la commande
      const newOrder = await createOrder({
        clientId: clientIdToUse,
        items: orderItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        tableNumber: tableNumber || undefined,
      });

      // Créer le paiement (partiel ou total)
      if (amountToPay > 0) {
        await createPayment({
          orderId: newOrder.id,
          amount: amountToPay,
          paymentMethod: paymentMethod,
        });
      }

      setCreatedOrderId(newOrder.id);
      setShowSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la commande');
      setLoading(false);
    }
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
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
                  const BASE_URL = import.meta.env.VITE_API_URL 
                    ? import.meta.env.VITE_API_URL.replace('/api', '')
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
                          {product.hasStock && (
                            <Chip
                              label={`Stock: ${product.stockQuantity || 0}`}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: '#E8F5E9',
                                color: '#2E7D32',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 24,
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
                          {product.hasStock && (
                            <Chip
                              label={`Stock: ${product.stockQuantity || 0}`}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: '#E8F5E9',
                                color: '#2E7D32',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 24,
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
                    {orderItems.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1,
                          borderBottom: index < orderItems.length - 1 ? '1px solid #F5F5F5' : 'none',
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#000000', mb: 0.25 }}>
                            {item.productName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666666' }}>
                            {item.quantity} × {Number(item.unitPrice).toFixed(0)} FCFA
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        </Box>
                      </Box>
                    ))}
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

                <TextField
                  label="Numéro de table (optionnel)"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  fullWidth
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

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
            {/* Récapitulatif */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: designTokens.borderRadius.large,
                backgroundColor: designTokens.colors.background.paper,
                boxShadow: designTokens.shadows.card,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: designTokens.colors.text.primary }}>
                Récapitulatif
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ color: designTokens.colors.text.secondary }}>
                  Sous-total
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: designTokens.colors.text.primary }}>
                  {totalAmount.toFixed(0)} FCFA
                </Typography>
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: designTokens.colors.text.primary }}>
                  Total à payer
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: designTokens.colors.primary.main,
                  }}
                >
                  {totalAmount.toFixed(0)} FCFA
                </Typography>
              </Box>
            </Paper>

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
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#FFD700', mb: 3 }}>
              {selectedProduct ? Number(selectedProduct.price).toFixed(0) : '0'} FCFA
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
              Total: {((selectedProduct ? Number(selectedProduct.price) : 0) * quantity).toFixed(0)} FCFA
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
