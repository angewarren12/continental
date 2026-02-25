import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardMedia,
  LinearProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  History as HistoryIcon,
  LocalBar as DrinkIcon,
  Add as AddIcon,
  LocalBar as LocalBarIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  ShoppingBag as ProductsIcon,
  AttachMoney as AttachMoneyIcon,
  Inventory as InventoryIcon,
  PhotoCamera as PhotoCameraIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarTodayIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  getAllStocks,
  getStockMovements,
  updateStock,
} from '@shared/api/stock';
import { getProducts, createProduct, updateProduct } from '@shared/api/products';
import { getCategories } from '@shared/api/categories';
import { ProductCreateInput, ProductTypeEnum, StockUnit, SaleUnit } from '@shared/types/product';
import ProductImageUpload from '../components/products/ProductImageUpload';
import CategorySelector from '../components/products/CategorySelector';
import { Stock } from '@shared/types/stock';
import { Product } from '@shared/types/product';
import { StockMovement } from '@shared/types/stock';
import { Category } from '@shared/types/category';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AnimatedCard from '../components/animations/AnimatedCard';
import SectionTitle from '../components/ui/SectionTitle';
import PageTransition from '../components/ui/PageTransition';
import { designTokens } from '../design-tokens';
import { staggerContainer, staggerItem } from '../constants/animations';

const StockScreen: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<(Stock & { product?: Product })[]>([]);
  const [allStocks, setAllStocks] = useState<(Stock & { product?: Product })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openSalesAnalysisDialog, setOpenSalesAnalysisDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedStock, setSelectedStock] = useState<(Stock & { product?: Product }) | null>(null);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [salesAnalysis, setSalesAnalysis] = useState<{
    lastRestockDate: Date | null;
    quantitySold: number;
    revenueGenerated: number;
    averageDailySales: number;
    daysSinceLastRestock: number;
    estimatedDaysUntilNextRestock: number | null;
    salesTrend: 'up' | 'down' | 'stable';
  } | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<'restock' | 'adjustment'>('restock');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [productFormData, setProductFormData] = useState<ProductCreateInput>({
    name: '',
    categoryId: undefined,
    productType: 'dish',
    imageUrl: undefined,
    description: '',
    price: 0,
    stockUnit: undefined,
    saleUnit: undefined,
    conversionFactor: undefined,
  });

  useEffect(() => {
    loadCategories();
    loadStocks();
  }, []);

  useEffect(() => {
    loadStocks();
  }, [selectedCategoryFilter]);

  useEffect(() => {
    // Filtrer les stocks par terme de recherche
    if (!searchTerm.trim()) {
      setStocks(allStocks);
    } else {
      const filtered = allStocks.filter((stock) =>
        stock.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setStocks(filtered);
    }
  }, [searchTerm, allStocks]);

  const loadCategories = async () => {
    try {
      // Charger toutes les catégories (pas de filtre par mainCategory pour le stock)
      // car on veut voir tous les produits avec stock, peu importe leur catégorie principale
      const allCategories = await getCategories();
      setCategories(allCategories);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  };

  const loadStocks = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedCategoryFilter) {
        filters.categoryId = selectedCategoryFilter;
      }
      const allStocks = await getAllStocks(filters);
      const allProducts = await getProducts({ categoryId: selectedCategoryFilter || undefined });

      const stocksWithProducts = allStocks
        .map((stock) => {
          const product = allProducts.find((p) => p.id === stock.productId);
          return { ...stock, product };
        })
        .filter((s) => s.product && s.product.productType !== 'dish'); // Exclure les plats seulement

      setAllStocks(stocksWithProducts);
      
      // Appliquer le filtre de recherche si actif
      if (!searchTerm.trim()) {
        setStocks(stocksWithProducts);
      } else {
        const filtered = stocksWithProducts.filter((stock) =>
          stock.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setStocks(filtered);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du stock');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjustDialog = (stock: Stock) => {
    setSelectedStock(stock);
    // Pour réapprovisionnement, initialiser à 0 (quantité à ajouter)
    // Pour ajustement, initialiser à la quantité actuelle (nouvelle quantité totale)
    setAdjustmentQuantity(adjustmentType === 'restock' ? 0 : stock.quantity);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStock(null);
    setAdjustmentQuantity(0);
  };

  const handleAdjustStock = async () => {
    if (!selectedStock) return;

    setLoading(true);
    setError(null);

    try {
      let newQuantity: number;
      
      if (adjustmentType === 'restock') {
        // Pour réapprovisionnement : quantité actuelle + quantité à ajouter
        newQuantity = selectedStock.quantity + adjustmentQuantity;
        if (adjustmentQuantity <= 0) {
          setError('La quantité à ajouter doit être supérieure à 0');
          setLoading(false);
          return;
        }
      } else {
        // Pour ajustement : nouvelle quantité totale
        newQuantity = adjustmentQuantity;
        if (adjustmentQuantity < 0) {
          setError('La quantité ne peut pas être négative');
          setLoading(false);
          return;
        }
      }

      const product = selectedStock.product;
      const updateData: any = {
        productId: selectedStock.productId,
        type: adjustmentType,
      };

      // Gérer selon le type de produit
      if (product?.productType === 'cigarette') {
        // Pour cigarettes: utiliser quantityUnits
        if (adjustmentType === 'restock') {
          const currentUnits = (selectedStock.quantityPackets || 0) * (product.conversionFactor || 20) + (selectedStock.quantityUnits || 0);
          updateData.quantityUnits = currentUnits + adjustmentQuantity;
        } else {
          updateData.quantityUnits = adjustmentQuantity;
        }
      } else if (product?.productType === 'egg') {
        // Pour œufs: utiliser quantityUnits
        if (adjustmentType === 'restock') {
          const currentUnits = (selectedStock.quantityPlates || 0) * (product.conversionFactor || 30) + (selectedStock.quantityUnits || 0);
          updateData.quantityUnits = currentUnits + adjustmentQuantity;
        } else {
          updateData.quantityUnits = adjustmentQuantity;
        }
      } else {
        // Pour les autres produits: utiliser quantity standard
        updateData.quantity = newQuantity;
      }

      await updateStock(selectedStock.productId, updateData);
      await loadStocks();
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: adjustmentType === 'restock' 
          ? `Réapprovisionnement réussi ! ${adjustmentQuantity} ${selectedStock.product?.stockUnit || 'unité'} ajouté(s). Nouvelle quantité: ${newQuantity} ${selectedStock.product?.stockUnit || 'unité'}`
          : `Stock mis à jour avec succès ! Nouvelle quantité: ${newQuantity} ${selectedStock.product?.stockUnit || 'unité'}`,
        severity: 'success',
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour du stock';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (stock: Stock) => {
    setSelectedStock(stock);
    setLoading(true);
    try {
      const movements = await getStockMovements(stock.productId);
      setStockMovements(movements);
      setOpenHistoryDialog(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSalesAnalysis = async (stock: Stock) => {
    setSelectedStock(stock);
    setLoading(true);
    try {
      const movements = await getStockMovements(stock.productId);
      
      // Trouver le dernier réapprovisionnement
      const restockMovements = movements
        .filter(m => m.type === 'restock')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const lastRestock = restockMovements[0];
      const lastRestockDate = lastRestock ? new Date(lastRestock.createdAt) : null;
      
      if (!lastRestockDate) {
        setSalesAnalysis({
          lastRestockDate: null,
          quantitySold: 0,
          revenueGenerated: 0,
          averageDailySales: 0,
          daysSinceLastRestock: 0,
          estimatedDaysUntilNextRestock: null,
          salesTrend: 'stable',
        });
        setOpenSalesAnalysisDialog(true);
        setLoading(false);
        return;
      }

      // Calculer les ventes depuis le dernier réapprovisionnement
      const salesSinceRestock = movements.filter(m => 
        m.type === 'sale' && new Date(m.createdAt) >= lastRestockDate
      );

      const quantitySold = salesSinceRestock.reduce((sum, m) => sum + m.quantity, 0);
      // Trouver le produit correspondant pour obtenir le prix
      const product = stocks.find((s) => s.productId === stock.productId)?.product;
      const revenueGenerated = quantitySold * (product?.price || 0);
      
      const now = new Date();
      const daysSinceLastRestock = Math.floor(
        (now.getTime() - lastRestockDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const averageDailySales = daysSinceLastRestock > 0 
        ? quantitySold / daysSinceLastRestock 
        : 0;

      // Estimer les jours jusqu'au prochain réapprovisionnement
      const currentStock = stock.quantity;
      const estimatedDaysUntilNextRestock = averageDailySales > 0 && currentStock > 0
        ? Math.floor(currentStock / averageDailySales)
        : null;

      // Déterminer la tendance (comparer les 7 derniers jours avec les 7 jours précédents)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const recentSales = salesSinceRestock.filter(m => 
        new Date(m.createdAt) >= sevenDaysAgo
      ).reduce((sum, m) => sum + m.quantity, 0);
      
      const previousSales = salesSinceRestock.filter(m => {
        const date = new Date(m.createdAt);
        return date >= fourteenDaysAgo && date < sevenDaysAgo;
      }).reduce((sum, m) => sum + m.quantity, 0);

      let salesTrend: 'up' | 'down' | 'stable' = 'stable';
      if (previousSales > 0) {
        const change = ((recentSales - previousSales) / previousSales) * 100;
        if (change > 10) salesTrend = 'up';
        else if (change < -10) salesTrend = 'down';
      } else if (recentSales > 0) {
        salesTrend = 'up';
      }

      setSalesAnalysis({
        lastRestockDate,
        quantitySold,
        revenueGenerated,
        averageDailySales,
        daysSinceLastRestock,
        estimatedDaysUntilNextRestock,
        salesTrend,
      });
      setOpenSalesAnalysisDialog(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (quantity: number, product?: Product) => {
    if (!product) return { color: '#666666', label: 'N/A', percentage: 0 };
    const maxStock = 100; // Valeur par défaut car stockQuantity n'existe plus
    const percentage = (quantity / maxStock) * 100;

    if (quantity === 0) return { color: '#DC143C', label: 'Rupture', percentage: 0 };
    if (quantity <= maxStock * 0.2)
      return { color: '#FF9800', label: 'Faible', percentage };
    return { color: '#2E7D32', label: 'Normal', percentage };
  };

  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      // Mode édition
      setEditingProduct(product);
      setProductFormData({
        name: product.name,
        categoryId: product.categoryId,
        productType: product.productType,
        imageUrl: product.imageUrl,
        description: product.description || '',
        price: product.price,
        stockUnit: product.stockUnit,
        saleUnit: product.saleUnit,
        conversionFactor: product.conversionFactor,
      });
    } else {
      // Mode création
      setEditingProduct(null);
      setProductFormData({
        name: '',
        categoryId: undefined,
        productType: 'dish',
        imageUrl: undefined,
        description: '',
        price: 0,
        stockUnit: undefined,
        saleUnit: undefined,
        conversionFactor: undefined,
      });
    }
    setOpenProductDialog(true);
  };

  const handleCloseProductDialog = () => {
    setOpenProductDialog(false);
    setEditingProduct(null);
  };

  const handleCreateProduct = async () => {
    if (!productFormData.name.trim() || productFormData.price <= 0) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Nettoyer les données avant l'envoi : convertir undefined en null et enlever les chaînes vides
      const cleanedData: ProductCreateInput = {
        name: productFormData.name.trim(),
        productType: productFormData.productType || 'dish',
        price: productFormData.price,
        stockUnit: productFormData.stockUnit,
        saleUnit: productFormData.saleUnit,
        conversionFactor: productFormData.conversionFactor,
        // Ne pas envoyer imageUrl si c'est undefined ou une chaîne vide
        ...(productFormData.imageUrl && productFormData.imageUrl.trim() 
          ? { imageUrl: productFormData.imageUrl.trim() } 
          : {}),
        // Ne pas envoyer description si c'est undefined ou une chaîne vide
        ...(productFormData.description && productFormData.description.trim() 
          ? { description: productFormData.description.trim() } 
          : {}),
        // Ne pas envoyer categoryId si c'est undefined
        ...(productFormData.categoryId ? { categoryId: productFormData.categoryId } : {}),
      };

      if (editingProduct) {
        // Mode édition
        console.log('Updating product with data:', cleanedData);
        await updateProduct(editingProduct.id, cleanedData);
        await loadStocks();
        handleCloseProductDialog();
        setSnackbar({
          open: true,
          message: 'Produit modifié avec succès !',
          severity: 'success',
        });
      } else {
        // Mode création
        console.log('Creating product with data:', cleanedData);
        await createProduct(cleanedData);
        await loadStocks();
        handleCloseProductDialog();
        setSnackbar({
          open: true,
          message: 'Produit créé avec succès !',
          severity: 'success',
        });
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      // Afficher les détails de l'erreur si disponibles
      let errorMessage = err.message || (editingProduct ? 'Erreur lors de la modification du produit' : 'Erreur lors de la création du produit');
      
      // Si l'erreur contient des détails de validation, les afficher
      if (err.message && err.message.includes('details')) {
        try {
          const detailsMatch = err.message.match(/\[(.*)\]/);
          if (detailsMatch) {
            errorMessage = `Erreur de validation: ${detailsMatch[1]}`;
          }
        } catch (e) {
          // Ignorer si le parsing échoue
        }
      }
      
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Type de boisson supprimé - on garde seulement la catégorie
  const productTypes: Record<'drink', ProductTypeEnum[]> = {
    drink: ['beer', 'wine'],
  };

  const activeCategories = categories.filter((cat) => cat.isActive);

  return (
    <PageTransition>
      <Box>
        <SectionTitle
          title="Gestion du Stock"
          subtitle={`${stocks.length} produit${stocks.length > 1 ? 's' : ''} en stock`}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: designTokens.colors.text.secondary,
                fontWeight: 500,
                fontSize: '0.9375rem',
                letterSpacing: '0.01em',
              }}
            >
              {stocks.length} {stocks.length === 1 ? 'produit en stock' : 'produits en stock'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<CategoryIcon />}
              onClick={() => navigate('/categories')}
              sx={{
                borderColor: designTokens.colors.primary.main,
                color: designTokens.colors.primary.main,
                borderRadius: designTokens.borderRadius.medium,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: designTokens.colors.primary.dark,
                  backgroundColor: `${designTokens.colors.primary.main}10`,
                },
              }}
            >
              Catégories
            </Button>
            <Button
              variant="outlined"
              startIcon={<ProductsIcon />}
              onClick={() => navigate('/products')}
              sx={{
                borderColor: designTokens.colors.primary.main,
                color: designTokens.colors.primary.main,
                borderRadius: designTokens.borderRadius.medium,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: designTokens.colors.primary.dark,
                  backgroundColor: `${designTokens.colors.primary.main}10`,
                },
              }}
            >
              Produits
            </Button>
            <IconButton
              onClick={() => handleOpenProductDialog()}
              sx={{
                backgroundColor: designTokens.colors.primary.main,
                color: '#FFFFFF',
                borderRadius: designTokens.borderRadius.medium,
                width: 40,
                height: 40,
                '&:hover': { 
                  backgroundColor: designTokens.colors.primary.dark,
                },
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>

      {/* Barre de recherche */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher un produit par nom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#666666' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#FFFFFF',
              '&:hover fieldset': {
                borderColor: '#bd0f3b',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#bd0f3b',
              },
            },
          }}
        />
      </Box>

      {/* Filtres par catégorie */}
      {categories.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Chip
                label="Toutes"
                onClick={() => setSelectedCategoryFilter(null)}
                sx={{
                  bgcolor: selectedCategoryFilter === null ? '#bd0f3b' : 'grey.300',
                  color: selectedCategoryFilter === null ? 'white' : 'black',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: selectedCategoryFilter === null ? '#8B0000' : 'grey.400',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              />
            </motion.div>
            {categories
              .filter((cat) => cat.isActive)
              .map((category) => (
                <motion.div 
                  key={category.id}
                  whileTap={{ scale: 0.95 }}
                >
                  <Chip
                    label={category.name}
                    onClick={() => setSelectedCategoryFilter(category.id)}
                    sx={{
                      bgcolor: selectedCategoryFilter === category.id ? category.color : 'grey.300',
                      color: selectedCategoryFilter === category.id ? 'white' : 'black',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: selectedCategoryFilter === category.id 
                          ? category.color 
                          : 'grey.400',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                    }}
                  />
                </motion.div>
              ))}
          </Box>
        </Box>
      )}

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
              color: '#bd0f3b',
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </motion.div>
      )}

      {loading && stocks.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 6 }}>
          <CircularProgress sx={{ color: '#bd0f3b', mb: 2 }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#666666',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  letterSpacing: '0.01em',
                }}
              >
                Chargement du stock...
              </Typography>
        </Box>
      ) : stocks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 3,
              backgroundColor: '#FFFFFF',
              border: '2px dashed #E0E0E0',
            }}
          >
            <Box sx={{ mb: 3 }}>
              <InventoryIcon sx={{ fontSize: 64, color: '#CCCCCC', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000', mb: 1 }}>
                Aucun stock disponible
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#666666', 
                  mb: 3,
                  fontWeight: 400,
                  fontSize: '0.9375rem',
                  letterSpacing: '0.01em',
                  lineHeight: 1.6,
                }}
              >
                Créez d'abord des produits de type boisson pour commencer à gérer votre stock.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenProductDialog()}
              size="large"
              sx={{
                backgroundColor: '#bd0f3b',
                color: '#FFFFFF',
                fontWeight: 600,
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': { 
                  backgroundColor: '#8B0000',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(189, 15, 59, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Créer mon premier produit
            </Button>
          </Paper>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <Grid container spacing={2}>
            {stocks.map((stock, index) => {
              const status = getStockStatus(stock.quantity, stock.product);
              // Construire l'URL de l'image correctement
              const getImageUrl = (imageUrl?: string) => {
                if (!imageUrl) return null;
                if (imageUrl.startsWith('http')) return imageUrl;
                // Les images sont servies directement depuis le serveur, pas via /api
                // @ts-ignore - Vite injects import.meta.env at build time
                const BASE_URL = (import.meta as any)?.env?.VITE_API_URL 
                  ? (import.meta as any).env.VITE_API_URL.replace('/api', '')
                  : 'http://localhost:3002';
                return `${BASE_URL}${imageUrl}`;
              };
              const imageUrl = getImageUrl(stock.product?.imageUrl);
              const category = stock.product?.categoryDetail || categories.find((c) => c.id === stock.product?.categoryId);
              return (
                <Grid item xs={12} sm={6} md={4} key={stock.id} sx={{ display: 'flex' }}>
                  <motion.div
                    variants={staggerItem}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: index * 0.05 }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <motion.div
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.4 }}
                        whileHover={{ y: -4 }}
                        style={{ height: '100%' }}
                      >
                      <AnimatedCard 
                        delay={index * 0.05}
                        sx={{ 
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          transition: 'box-shadow 0.3s ease',
                        }}
                      >
                      {imageUrl ? (
                        <Box
                          sx={{
                            position: 'relative',
                            width: '100%',
                            height: 200,
                            overflow: 'hidden',
                            borderRadius: '12px 12px 0 0',
                            backgroundColor: '#F5F5F5',
                          }}
                        >
                          <CardMedia
                            component="img"
                            image={imageUrl}
                            alt={stock.product?.name || 'Produit'}
                            sx={{ 
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.05)',
                              },
                            }}
                            onError={(e: any) => {
                              // Si l'image ne charge pas, masquer l'élément
                              e.target.style.display = 'none';
                            }}
                          />
                          {/* Overlay pour le statut */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: status.color,
                              color: '#FFFFFF',
                              px: 2,
                              py: 0.75,
                              borderRadius: 3,
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                              backdropFilter: 'blur(4px)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          >
                            {status.label}
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 200,
                            backgroundColor: '#F5F5F5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px 12px 0 0',
                          }}
                        >
                          <LocalBarIcon sx={{ fontSize: 64, color: '#CCCCCC' }} />
                        </Box>
                      )}
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', color: '#000000' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                {category && (
                                  <Chip
                                    label={category.name}
                                    size="small"
                                    sx={{
                                      bgcolor: category.color,
                                      color: '#FFFFFF',
                                      fontWeight: 700,
                                      fontSize: '0.8125rem',
                                      letterSpacing: '0.02em',
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                                    }}
                                  />
                                )}
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 700, 
                                    color: '#000000',
                                    fontSize: '1.125rem',
                                    letterSpacing: '-0.01em',
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {stock.product?.name || 'N/A'}
                                </Typography>
                              </Box>
                              {stock.product && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleOpenProductDialog(stock.product);
                                  }}
                                  sx={{
                                    color: '#DC143C',
                                    backgroundColor: 'rgba(220, 20, 60, 0.1)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(220, 20, 60, 0.2)',
                                    },
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              )}
                            </Box>
                            <Box sx={{ mb: 1.5 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 1,
                                }}
                              >
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#666666',
                                    fontWeight: 500,
                                  }}
                                >
                                  Stock actuel
                                </Typography>
                                <Typography
                                  variant="h6"
                                  sx={{ 
                                    fontWeight: 700, 
                                    color: status.color,
                                    fontSize: '1.1rem',
                                  }}
                                >
                                  {(() => {
                                    const product = stock.product;
                                    if (product?.productType === 'cigarette') {
                                      const packets = stock.quantityPackets || 0;
                                      const units = stock.quantityUnits || 0;
                                      if (packets > 0 && units > 0) {
                                        return `${packets} paquet${packets > 1 ? 's' : ''} (${units} cigarettes)`;
                                      } else if (packets > 0) {
                                        return `${packets} paquet${packets > 1 ? 's' : ''}`;
                                      } else {
                                        return `${units} cigarette${units > 1 ? 's' : ''}`;
                                      }
                                    } else if (product?.productType === 'egg') {
                                      const plates = stock.quantityPlates || 0;
                                      const units = stock.quantityUnits || 0;
                                      if (plates > 0 && units > 0) {
                                        return `${plates} plaquette${plates > 1 ? 's' : ''} (${units} œufs)`;
                                      } else if (plates > 0) {
                                        return `${plates} plaquette${plates > 1 ? 's' : ''}`;
                                      } else {
                                        return `${units} œuf${units > 1 ? 's' : ''}`;
                                      }
                                    } else {
                                      return `${stock.quantity} ${stock.product?.stockUnit || 'unité'}`;
                                    }
                                  })()}
                                </Typography>
                              </Box>
                              <Box sx={{ position: 'relative' }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={status.percentage}
                                  sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#F5F5F5',
                                    overflow: 'hidden',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: status.color,
                                      borderRadius: 5,
                                      transition: 'width 0.6s ease',
                                    },
                                  }}
                                />
                                {/* Indicateur de pourcentage */}
                                {status.percentage > 0 && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      position: 'absolute',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      color: status.percentage > 50 ? '#FFFFFF' : status.color,
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                      textShadow: status.percentage > 50 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                                    }}
                                  >
                                    {Math.round(status.percentage)}%
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            {stock.product?.price && stock.quantity > 0 && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  mb: 1,
                                  mt: 1.5,
                                  p: 1,
                                  backgroundColor: '#F5F5F5',
                                  borderRadius: 2,
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                                  <AttachMoneyIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: '#666666',
                                      fontWeight: 500,
                                      fontSize: '0.875rem',
                                    }}
                                  >
                                    Valeur estimée :
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: '#4CAF50',
                                      fontWeight: 700,
                                      fontSize: '1rem',
                                    }}
                                  >
                                    {(stock.quantity * stock.product.price).toFixed(0)} FCFA
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewSalesAnalysis(stock)}
                                  sx={{
                                    color: '#4CAF50',
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                    },
                                  }}
                                >
                                  <VisibilityIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Box>
                            )}
                            <Chip
                              label={status.label}
                              size="small"
                              sx={{
                                backgroundColor: `${status.color}15`,
                                color: status.color,
                                fontWeight: 700,
                                border: `1.5px solid ${status.color}50`,
                                fontSize: '0.8125rem',
                                height: 28,
                                letterSpacing: '0.02em',
                                px: 1,
                              }}
                            />
                          </Box>
                        </Box>
                        
                        {/* Boutons d'action - Design mobile optimisé avec feedback tactile */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                          <motion.div
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                          >
                          <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenAdjustDialog(stock)}
                            fullWidth
                            sx={{
                              backgroundColor: '#bd0f3b',
                              color: '#FFFFFF',
                              fontWeight: 700,
                              borderRadius: 2,
                              py: 1.5,
                              textTransform: 'none',
                              fontSize: '1rem',
                              letterSpacing: '0.02em',
                              boxShadow: '0 2px 8px rgba(189, 15, 59, 0.3)',
                              transition: 'all 0.2s ease',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                              '&:hover': {
                                backgroundColor: '#8B0000',
                                boxShadow: '0 4px 12px rgba(189, 15, 59, 0.4)',
                                transform: 'translateY(-2px)',
                              },
                              '&:active': {
                                transform: 'translateY(0)',
                                boxShadow: '0 2px 4px rgba(189, 15, 59, 0.3)',
                              },
                            }}
                          >
                            Modifier le stock
                          </Button>
                          </motion.div>
                          <motion.div
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                          >
                          <Button
                            variant="outlined"
                            startIcon={<HistoryIcon />}
                            onClick={() => handleViewHistory(stock)}
                            fullWidth
                            sx={{
                              borderColor: '#666666',
                              borderWidth: 2,
                              color: '#666666',
                              fontWeight: 700,
                              borderRadius: 2,
                              py: 1.5,
                              textTransform: 'none',
                              fontSize: '1rem',
                              letterSpacing: '0.02em',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: '#bd0f3b',
                                borderWidth: 2.5,
                                color: '#bd0f3b',
                                backgroundColor: 'rgba(189, 15, 59, 0.08)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(189, 15, 59, 0.2)',
                              },
                              '&:active': {
                                transform: 'translateY(0)',
                              },
                            }}
                          >
                            Voir l'historique
                          </Button>
                          </motion.div>
                        </Box>
                      </CardContent>
                    </AnimatedCard>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </motion.div>
      )}

      {/* Dialog pour ajuster le stock */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 700, 
            color: '#000000',
            fontSize: '1.25rem',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
          }}
        >
          Réapprovisionner le stock
        </DialogTitle>
        <DialogContent>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#666666', 
              mb: 2,
              fontWeight: 500,
              fontSize: '0.9375rem',
              letterSpacing: '0.01em',
            }}
          >
            Produit: <strong style={{ color: '#000000', fontWeight: 700 }}>{selectedStock?.product?.name || 'N/A'}</strong>
          </Typography>
          
          {/* Affichage de la quantité actuelle */}
          <Box 
            sx={{ 
              mb: 2, 
              p: 2, 
              backgroundColor: '#F5F5F5', 
              borderRadius: 2,
              border: '1px solid #E0E0E0',
            }}
          >
            <Typography variant="body2" sx={{ color: '#666666', mb: 0.5 }}>
              Quantité actuelle
            </Typography>
            <Typography variant="h6" sx={{ color: '#000000', fontWeight: 700 }}>
              {selectedStock?.quantity || 0} {selectedStock?.product?.stockUnit || 'unité'}(s)
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Quantité à ajouter"
            type="number"
            value={adjustmentQuantity}
            onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
            margin="normal"
            inputProps={{ min: 1 }}
            helperText={`Nouvelle quantité totale: ${(selectedStock?.quantity || 0) + adjustmentQuantity} ${selectedStock?.product?.stockUnit || 'unité'}(s)`}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: '#666666',
              fontWeight: 700,
              fontSize: '0.9375rem',
              letterSpacing: '0.02em',
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleAdjustStock}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#bd0f3b',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.9375rem',
              letterSpacing: '0.02em',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                backgroundColor: '#8B0000',
              },
              '&:disabled': {
                backgroundColor: '#CCCCCC',
                textShadow: 'none',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour l'historique */}
      <Dialog
        open={openHistoryDialog}
        onClose={() => setOpenHistoryDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 700, 
            color: '#000000',
            fontSize: '1.25rem',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
          }}
        >
          Historique - {selectedStock?.product?.name || 'N/A'}
        </DialogTitle>
        <DialogContent>
          {stockMovements.length === 0 ? (
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#666666', 
                textAlign: 'center', 
                py: 4,
                fontWeight: 500,
                fontSize: '0.9375rem',
                letterSpacing: '0.01em',
              }}
            >
              Aucun mouvement
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              {stockMovements.map((movement) => (
                <Card key={movement.id} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666666', 
                            mb: 0.5,
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            letterSpacing: '0.01em',
                          }}
                        >
                          {format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm', {
                            locale: fr,
                          })}
                        </Typography>
                        <Chip
                          label={
                            movement.type === 'sale'
                              ? 'Vente'
                              : movement.type === 'restock'
                              ? 'Réapprovisionnement'
                              : 'Ajustement'
                          }
                          size="small"
                          sx={{
                            backgroundColor: '#F5F5F5',
                            color: '#666666',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            letterSpacing: '0.02em',
                          }}
                        />
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666666',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            letterSpacing: '0.01em',
                            mb: 0.5,
                          }}
                        >
                          {movement.previousStock} → {movement.newStock}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            letterSpacing: '0.02em',
                            color:
                              movement.type === 'sale' ? '#bd0f3b' : '#2E7D32',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          {movement.type === 'sale' ? '-' : '+'}
                          {Math.abs(movement.quantity)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenHistoryDialog(false)}
            sx={{
              color: '#bd0f3b',
              fontWeight: 600,
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour l'analyse des ventes */}
      <Dialog
        open={openSalesAnalysisDialog}
        onClose={() => setOpenSalesAnalysisDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 700, 
            color: '#000000',
            fontSize: '1.25rem',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <VisibilityIcon sx={{ color: '#4CAF50', fontSize: 24 }} />
          Analyse des ventes - {selectedStock?.product?.name || 'N/A'}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#4CAF50' }} />
            </Box>
          ) : salesAnalysis ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              {/* Dernier réapprovisionnement */}
              {salesAnalysis.lastRestockDate && (
                <Card sx={{ borderRadius: 2, backgroundColor: '#F5F5F5' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CalendarTodayIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                        Dernier réapprovisionnement
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#4CAF50', mb: 0.5 }}>
                      {format(salesAnalysis.lastRestockDate, 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666666' }}>
                      Il y a {salesAnalysis.daysSinceLastRestock} jour{salesAnalysis.daysSinceLastRestock > 1 ? 's' : ''}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Statistiques de vente */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ borderRadius: 2, backgroundColor: '#E8F5E9', border: '2px solid #4CAF50' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <InventoryIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>
                          Quantité vendue
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                        {salesAnalysis.quantitySold}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666666' }}>
                        {selectedStock?.product?.stockUnit || 'unité'}(s) depuis le dernier réapprovisionnement
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card sx={{ borderRadius: 2, backgroundColor: '#E3F2FD', border: '2px solid #2196F3' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AttachMoneyIcon sx={{ color: '#2196F3', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>
                          Revenus générés
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976D2' }}>
                        {salesAnalysis.revenueGenerated.toFixed(0)} FCFA
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666666' }}>
                        Depuis le dernier réapprovisionnement
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card sx={{ borderRadius: 2, backgroundColor: '#FFF3E0', border: '2px solid #FF9800' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingUpIcon sx={{ color: '#FF9800', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>
                          Vente moyenne/jour
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#F57C00' }}>
                        {salesAnalysis.averageDailySales.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666666' }}>
                        {selectedStock?.product?.stockUnit || 'unité'}(s) par jour en moyenne
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card sx={{ 
                    borderRadius: 2, 
                    backgroundColor: salesAnalysis.salesTrend === 'up' ? '#E8F5E9' : salesAnalysis.salesTrend === 'down' ? '#FFEBEE' : '#F5F5F5',
                    border: `2px solid ${salesAnalysis.salesTrend === 'up' ? '#4CAF50' : salesAnalysis.salesTrend === 'down' ? '#F44336' : '#9E9E9E'}`
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {salesAnalysis.salesTrend === 'up' ? (
                          <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                        ) : salesAnalysis.salesTrend === 'down' ? (
                          <TrendingDownIcon sx={{ color: '#F44336', fontSize: 20 }} />
                        ) : (
                          <InfoIcon sx={{ color: '#9E9E9E', fontSize: 20 }} />
                        )}
                        <Typography variant="body2" sx={{ color: '#666666', fontWeight: 500 }}>
                          Tendance
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        color: salesAnalysis.salesTrend === 'up' ? '#2E7D32' : salesAnalysis.salesTrend === 'down' ? '#C62828' : '#616161'
                      }}>
                        {salesAnalysis.salesTrend === 'up' ? 'En hausse' : salesAnalysis.salesTrend === 'down' ? 'En baisse' : 'Stable'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666666' }}>
                        Comparaison des 7 derniers jours
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Estimation prochain réapprovisionnement */}
              {salesAnalysis.estimatedDaysUntilNextRestock !== null && (
                <Card sx={{ borderRadius: 2, backgroundColor: '#FFF9C4', border: '2px solid #FBC02D' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarTodayIcon sx={{ color: '#F57F17', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                        Estimation prochain réapprovisionnement
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#F57F17', mb: 1 }}>
                      Dans environ {salesAnalysis.estimatedDaysUntilNextRestock} jour{salesAnalysis.estimatedDaysUntilNextRestock > 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666666' }}>
                      Basé sur la vente moyenne de {salesAnalysis.averageDailySales.toFixed(1)} {selectedStock?.product?.stockUnit || 'unité'}(s)/jour
                      et le stock actuel de {selectedStock?.quantity} {selectedStock?.product?.stockUnit || 'unité'}(s)
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {!salesAnalysis.lastRestockDate && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Aucun réapprovisionnement enregistré pour ce produit.
                </Alert>
              )}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#666666', textAlign: 'center', py: 4 }}>
              Aucune donnée disponible
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenSalesAnalysisDialog(false)}
            sx={{
              color: '#4CAF50',
              fontWeight: 600,
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour créer un produit */}
      <Dialog
        open={openProductDialog}
        onClose={handleCloseProductDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            maxHeight: '90vh',
          },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              color: '#000000',
              fontSize: '1.25rem',
              pb: 2,
              borderBottom: '2px solid #F5F5F5',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <LocalBarIcon sx={{ color: '#bd0f3b', fontSize: 28 }} />
            {editingProduct ? 'Modifier le produit' : 'Nouveau produit (Boisson)'}
          </DialogTitle>
        </motion.div>

        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Section Image */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <PhotoCameraIcon sx={{ color: '#bd0f3b', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                    Image du produit
                  </Typography>
                </Box>
                <ProductImageUpload
                  value={productFormData.imageUrl}
                  onChange={(url) => setProductFormData({ ...productFormData, imageUrl: url || undefined })}
                />
              </Box>
            </motion.div>

            <Divider sx={{ my: 1 }} />

            {/* Section Informations de base */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InfoIcon sx={{ color: '#bd0f3b', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                    Informations de base
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nom du produit"
                      value={productFormData.name}
                      onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                      required
                      placeholder="Ex: Bière Premium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocalBarIcon sx={{ color: '#666666', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Nom unique du produit"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#bd0f3b',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#bd0f3b',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={productFormData.description || ''}
                      onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                      multiline
                      rows={3}
                      placeholder="Décrivez le produit..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                            <DescriptionIcon sx={{ color: '#666666', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Description détaillée du produit (optionnel)"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#bd0f3b',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#bd0f3b',
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </motion.div>

            <Divider sx={{ my: 1 }} />

            {/* Section Catégorie et Type */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CategoryIcon sx={{ color: '#bd0f3b', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                    Classification
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {activeCategories.length > 0 && (
                    <Grid item xs={12} sm={6}>
                      <CategorySelector
                        categories={activeCategories}
                        value={productFormData.categoryId || null}
                        onChange={(categoryId) => setProductFormData({ ...productFormData, categoryId: categoryId || undefined })}
                        label="Catégorie"
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            </motion.div>

            <Divider sx={{ my: 1 }} />

            {/* Section Prix */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AttachMoneyIcon sx={{ color: '#bd0f3b', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                    Tarification
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Prix unitaire"
                      type="number"
                      value={productFormData.price}
                      onChange={(e) =>
                        setProductFormData({ ...productFormData, price: parseFloat(e.target.value) || 0 })
                      }
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoneyIcon sx={{ color: '#666666', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
                      }}
                      helperText="Prix de vente en francs CFA"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: '#bd0f3b',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#bd0f3b',
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </motion.div>

            {!editingProduct && (
              <>
                <Divider sx={{ my: 1 }} />

                {/* Section Stock */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <InventoryIcon sx={{ color: '#bd0f3b', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                        Gestion du stock
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Unité de stock"
                          value={productFormData.stockUnit || ''}
                          onChange={(e) =>
                            setProductFormData({
                              ...productFormData,
                              stockUnit: e.target.value as StockUnit,
                            })
                          }
                          helperText="Unité de stock (packet, unit, plate)"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover fieldset': {
                                borderColor: '#bd0f3b',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#bd0f3b',
                              },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Unité de vente"
                          value={productFormData.saleUnit || ''}
                          onChange={(e) => setProductFormData({ ...productFormData, saleUnit: e.target.value as SaleUnit })}
                          helperText="Unité de vente (packet, unit, plate)"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover fieldset': {
                                borderColor: '#bd0f3b',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#bd0f3b',
                              },
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </motion.div>
              </>
            )}
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 2,
            backgroundColor: '#FAFAFA',
          }}
        >
          <Button
            onClick={handleCloseProductDialog}
            variant="outlined"
            sx={{
              color: '#666666',
              fontWeight: 600,
              borderColor: '#E0E0E0',
              borderRadius: 2,
              px: 3,
              '&:hover': {
                borderColor: '#bd0f3b',
                color: '#bd0f3b',
                backgroundColor: 'rgba(189, 15, 59, 0.05)',
              },
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreateProduct}
            variant="contained"
            disabled={loading || !productFormData.name.trim() || productFormData.price <= 0}
            sx={{
              backgroundColor: '#bd0f3b',
              color: '#FFFFFF',
              fontWeight: 600,
              borderRadius: 2,
              px: 4,
              '&:hover': {
                backgroundColor: '#8B0000',
              },
              '&:disabled': {
                backgroundColor: '#CCCCCC',
                color: '#FFFFFF',
              },
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
                <Typography variant="body2">{editingProduct ? 'Modification...' : 'Création...'}</Typography>
              </Box>
            ) : (
              editingProduct ? 'Modifier le produit' : 'Créer le produit'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            backgroundColor: snackbar.severity === 'success' ? '#2E7D32' : '#bd0f3b',
            color: '#FFFFFF',
            '& .MuiAlert-icon': {
              color: '#FFFFFF',
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </PageTransition>
  );
};

export default StockScreen;
