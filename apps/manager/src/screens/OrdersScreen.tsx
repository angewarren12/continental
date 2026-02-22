import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Fab,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Divider,
  Avatar,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalDining as TableIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import {
  getOrders,
  updateOrder,
  getOrder,
  createPayment,
  addItemsToOrder,
} from '@shared/api/orders';
import { getProducts } from '@shared/api/products';
import { getCategories } from '@shared/api/categories';
import { getAllStocks } from '@shared/api/stock';
import { Product } from '@shared/types/product';
import { Category } from '@shared/types/category';
import { OrderItem } from '@shared/types/order';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '@shared/types/order';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { staggerContainer, staggerItem, slideUp, scale } from '../constants/animations';
import SectionTitle from '../components/ui/SectionTitle';
import StatCard from '../components/ui/StatCard';
import AnimatedCard from '../components/ui/AnimatedCard';
import PageTransition from '../components/ui/PageTransition';
import { designTokens } from '../design-tokens';

type ViewMode = 'list' | 'card';

const OrdersScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [openAddItemsDialog, setOpenAddItemsDialog] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openQuantityDialog, setOpenQuantityDialog] = useState(false);
  const [itemsToAdd, setItemsToAdd] = useState<OrderItem[]>([]);

  useEffect(() => {
    loadOrders();
  }, [paymentStatusFilter]);

  // Vérifier si un orderId est dans l'URL et ouvrir le modal automatiquement
  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    if (orderIdParam) {
      const orderId = parseInt(orderIdParam);
      
      // D'abord chercher dans la liste des commandes chargées
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setOpenDialog(true);
        // Nettoyer l'URL après avoir ouvert le modal
        searchParams.delete('orderId');
        setSearchParams(searchParams);
      } else if (orders.length > 0) {
        // Si la commande n'est pas dans la liste, la charger depuis l'API
        const loadOrderFromUrl = async () => {
          try {
            const order = await getOrder(orderId);
            if (order) {
              setSelectedOrder(order);
              setOpenDialog(true);
            }
          } catch (err: any) {
            console.error('Erreur lors du chargement de la commande:', err);
          }
          // Nettoyer l'URL après avoir chargé
          searchParams.delete('orderId');
          setSearchParams(searchParams);
        };
        loadOrderFromUrl();
      }
    }
  }, [orders, searchParams, setSearchParams]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (paymentStatusFilter !== 'all') {
        filters.paymentStatus = paymentStatusFilter;
      }
      const allOrders = await getOrders(filters);
      setOrders(allOrders);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const loadProductsForAddItems = async () => {
    try {
      const [allProducts, allStocks, allCategories] = await Promise.all([
        getProducts({ isActive: true }),
        getAllStocks(),
        getCategories(),
      ]);
      
      const productsWithStock = allProducts.map((product) => {
        const stock = allStocks.find((s) => s.productId === product.id);
        return {
          ...product,
          stockQuantity: stock ? stock.quantity : (product.stockQuantity || 0),
          hasStock: stock ? stock.quantity > 0 : (product.hasStock || false),
        };
      });
      
      setProducts(productsWithStock);
      setCategories(allCategories.filter(c => c.isActive));
      setItemsToAdd([]);
      setSelectedCategoryId(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des produits');
    }
  };

  const handleProductClickForAdd = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setOpenQuantityDialog(true);
  };

  const handleAddToItemsList = () => {
    if (!selectedProduct) return;

    if (selectedProduct.hasStock && selectedProduct.stockQuantity !== undefined) {
      const currentInList = itemsToAdd
        .filter((item) => item.productId === selectedProduct.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (currentInList + quantity > selectedProduct.stockQuantity) {
        setError(
          `Stock insuffisant. Disponible: ${selectedProduct.stockQuantity - currentInList}`
        );
        return;
      }
    }

    const existingItemIndex = itemsToAdd.findIndex(
      (item) => item.productId === selectedProduct.id
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...itemsToAdd];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].totalPrice =
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setItemsToAdd(updatedItems);
    } else {
      const newItem: OrderItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        unitPrice: Number(selectedProduct.price),
        totalPrice: quantity * Number(selectedProduct.price),
      };
      setItemsToAdd([...itemsToAdd, newItem]);
    }

    setOpenQuantityDialog(false);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleAddItemsToOrder = async () => {
    if (!selectedOrder || itemsToAdd.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const updatedOrder = await addItemsToOrder(selectedOrder.id, {
        items: itemsToAdd.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      
      setSelectedOrder(updatedOrder);
      setOpenAddItemsDialog(false);
      setItemsToAdd([]);
      await loadOrders();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout des articles');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategoryId === null) return true;
    return product.categoryId === selectedCategoryId;
  });

  const handleViewOrder = async (orderId: number) => {
    setLoading(true);
    try {
      const order = await getOrder(orderId);
      if (order) {
        setSelectedOrder(order);
        setOpenDialog(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la commande');
    } finally {
      setLoading(false);
    }
  };


  const handleOpenPaymentDialog = (order: Order) => {
    setSelectedOrder(order);
    setOpenPaymentDialog(true);
  };

  const handleProcessPayment = async (paymentMethod: PaymentMethod) => {
    if (!selectedOrder) return;

    const amount = paymentAmount ? parseFloat(paymentAmount) : Number(selectedOrder.totalAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Montant invalide');
      return;
    }

    // Vérifier que paymentMethod est valide
    if (paymentMethod !== 'cash' && paymentMethod !== 'wave') {
      setError('Méthode de paiement invalide');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { order } = await createPayment({
        orderId: selectedOrder.id,
        amount: Number(amount), // S'assurer que c'est un nombre
        paymentMethod: paymentMethod as 'cash' | 'wave',
      });
      
      // Fermer le dialog de paiement d'abord
      setOpenPaymentDialog(false);
      setPaymentAmount('');
      
      // Attendre un peu pour que le dialog se ferme complètement avant de mettre à jour
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Recharger les commandes et mettre à jour la commande sélectionnée
      await loadOrders();
      
      // Mettre à jour la commande sélectionnée si le dialog principal est ouvert
      if (openDialog) {
        // Recharger la commande depuis l'API pour avoir les dernières données
        const updatedOrder = await getOrder(order.id);
        setSelectedOrder(updatedOrder);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Erreur lors du traitement du paiement';
      const errorDetails = err.response?.data?.details;
      setError(errorDetails ? `${errorMessage}: ${JSON.stringify(errorDetails)}` : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'preparing':
        return '#2196F3';
      case 'ready':
        return '#2E7D32';
      case 'completed':
        return '#666666';
      case 'cancelled':
        return '#DC143C';
      default:
        return '#666666';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Commande en attente';
      case 'preparing':
        return 'En préparation';
      case 'ready':
        return 'Prêt';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    return status === 'paid' ? '#2E7D32' : status === 'failed' ? '#DC143C' : '#FF9800';
  };

  const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'pending':
        return 'Paiement en attente';
      case 'failed':
        return 'Échoué';
      default:
        return status;
    }
  };

  // Statistiques
  const stats = useMemo(() => {
    const total = orders.length;
    
    // Calculer le chiffre d'affaires en incluant tous les paiements (partiels ou complets)
    const getPaidAmount = (order: Order): number => {
      if (!order.payments || order.payments.length === 0) {
        return 0;
      }
      return order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    };
    
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + getPaidAmount(order);
    }, 0);
    
    const unpaid = orders.filter((o) => o.paymentStatus === 'pending').length;

    return { total, totalRevenue, unpaid };
  }, [orders]);

  // Filtrage et tri
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders;

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(searchTerm) ||
          order.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.totalAmount.toString().includes(searchTerm)
      );
    }

    // Tri
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [orders, searchTerm, sortBy]);

  return (
    <PageTransition>
      <Box>
        {/* Header avec statistiques */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <SectionTitle 
            title="Commandes"
            subtitle={`${stats.total} commande${stats.total > 1 ? 's' : ''} au total`}
          />
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                border: '1px solid #E0E0E0',
                '&.Mui-selected': {
                  backgroundColor: '#DC143C',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: '#B71C1C',
                  },
                },
              },
            }}
          >
            <ToggleButton value="card" aria-label="vue cartes">
              <ViewModuleIcon sx={{ mr: 1 }} />
              Cartes
            </ToggleButton>
            <ToggleButton value="list" aria-label="vue liste">
              <ViewListIcon sx={{ mr: 1 }} />
              Liste
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <StatCard
            title="Total"
            value={stats.total}
            icon={<ReceiptIcon />}
            color={designTokens.colors.status.info}
            delay={0.1}
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            title="Chiffre d'affaires"
            value={`${Number(stats.totalRevenue).toFixed(0)} FCFA`}
            icon={<MoneyIcon />}
            color={designTokens.colors.status.success}
            delay={0.2}
          />
        </Grid>
        <Grid item xs={12}>
          <StatCard
            title="Non payées"
            value={stats.unpaid}
            icon={<PaymentIcon />}
            color={designTokens.colors.status.warning}
            delay={0.3}
          />
        </Grid>
      </Grid>

      {/* Filtres et recherche */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Paper
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: designTokens.borderRadius.large,
            backgroundColor: designTokens.colors.background.paper,
            boxShadow: designTokens.shadows.card,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Rechercher par ID, table, montant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
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
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
              <InputLabel>Paiement</InputLabel>
              <Select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                label="Paiement"
                sx={{ borderRadius: 2 }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: '#FFFFFF',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      },
                    },
                  }}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="paid">Payé</MenuItem>
                <MenuItem value="failed">Échoué</MenuItem>
              </Select>
            </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Trier par</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  label="Trier par"
                  sx={{ borderRadius: 2 }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: '#FFFFFF',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      },
                    },
                  }}
                >
                  <MenuItem value="date">Date (récent)</MenuItem>
                  <MenuItem value="amount">Montant (décroissant)</MenuItem>
                  <MenuItem value="status">Statut</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
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

      {loading && orders.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: '#DC143C' }} />
        </Box>
      ) : (
        <AnimatePresence mode="wait">
          {filteredAndSortedOrders.length === 0 ? (
        <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: designTokens.borderRadius.large,
                backgroundColor: designTokens.colors.background.paper,
                boxShadow: designTokens.shadows.card,
              }}
            >
                <ReceiptIcon sx={{ fontSize: 64, color: designTokens.colors.text.disabled, mb: 2 }} />
                <Typography variant="h6" sx={{ color: designTokens.colors.text.secondary, mb: 1 }}>
                  Aucune commande trouvée
                </Typography>
                <Typography variant="body2" sx={{ color: designTokens.colors.text.disabled }}>
                  {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Aucune commande pour le moment'}
                </Typography>
            </Paper>
            </motion.div>
          ) : viewMode === 'card' ? (
                <motion.div
              key="cards"
              variants={staggerContainer}
                  initial="initial"
                  animate="animate"
            >
              <Grid container spacing={3}>
                {filteredAndSortedOrders.map((order, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={order.id}>
                    <motion.div
                      variants={staggerItem}
                      whileHover={{ y: -4 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <AnimatedCard
                        delay={index * 0.05}
                        hover
                        onClick={() => handleViewOrder(order.id)}
                        sx={{
                          height: '100%',
                          cursor: 'pointer',
                          border: `2px solid ${
                            order.status === 'ready'
                              ? designTokens.colors.status.success
                              : order.status === 'cancelled'
                              ? designTokens.colors.status.error
                              : 'transparent'
                          }`,
                          '&:hover': {
                            backgroundColor: designTokens.colors.background.light,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2.5, backgroundColor: 'transparent' }}>
                          {/* Header */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                              mb: 2,
                            }}
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#666666',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  mb: 0.5,
                                }}
                              >
                                <CalendarIcon sx={{ fontSize: 14 }} />
                                {format(new Date(order.createdAt), 'dd MMM', { locale: fr })}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#999999',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <AccessTimeIcon sx={{ fontSize: 12 }} />
                                {formatDistanceToNow(new Date(order.createdAt), {
                                  addSuffix: true,
                                locale: fr,
                              })}
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: '#DC143C',
                                fontSize: '1.25rem',
                              }}
                            >
                              #{order.id}
                          </Typography>
                          </Box>

                          {/* Montant */}
                          <Box
                            sx={{
                              mb: 2,
                              p: 1.5,
                              borderRadius: 2,
                              backgroundColor: '#F5F5F5',
                            }}
                          >
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 700,
                                color: '#000000',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <MoneyIcon sx={{ fontSize: 20, color: '#DC143C' }} />
                              {Number(order.totalAmount).toFixed(0)} FCFA
                            </Typography>
                            {(() => {
                              const payments = order.payments || [];
                              const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
                              const remaining = Number(order.totalAmount) - totalPaid;
                              if (remaining > 0) {
                                return (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: '#DC143C',
                                      fontWeight: 600,
                                      fontSize: '0.875rem',
                                    }}
                                  >
                                    Reste: {remaining.toFixed(0)} FCFA
                                  </Typography>
                                );
                              }
                              return null;
                            })()}
                          </Box>

                          {/* Statut de paiement */}
                          <Box sx={{ mb: 2 }}>
                            <Chip
                              label={getPaymentStatusLabel(order.paymentStatus)}
                              size="small"
                              sx={{
                                backgroundColor: `${getPaymentStatusColor(order.paymentStatus)}15`,
                                color: getPaymentStatusColor(order.paymentStatus),
                                fontWeight: 600,
                                width: 'fit-content',
                              }}
                            />
                          </Box>

                          {/* Infos supplémentaires */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {order.tableNumber && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TableIcon sx={{ fontSize: 16, color: '#666666' }} />
                                <Typography variant="body2" sx={{ color: '#666666' }}>
                                  Table {order.tableNumber}
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ReceiptIcon sx={{ fontSize: 16, color: '#666666' }} />
                              <Typography variant="body2" sx={{ color: '#666666' }}>
                                {order.items.length} article{order.items.length > 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Actions */}
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              mt: 2,
                              pt: 2,
                              borderTop: '1px solid #E0E0E0',
                            }}
                          >
                            <Tooltip title="Voir les détails">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewOrder(order.id);
                                }}
                                sx={{
                                  color: '#DC143C',
                                  '&:hover': {
                                    backgroundColor: 'rgba(220, 20, 60, 0.1)',
                                  },
                                }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {order.paymentStatus !== 'paid' && (
                              <Tooltip title="Traiter le paiement">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPaymentDialog(order);
                                  }}
                                  sx={{
                                    color: '#2E7D32',
                                    '&:hover': {
                                      backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                    },
                                  }}
                                >
                                  <PaymentIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </CardContent>
                      </AnimatedCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <Paper
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {filteredAndSortedOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    variants={staggerItem}
                    whileHover={{ backgroundColor: '#F9F9F9' }}
                  >
                    <Box
                      sx={{
                        p: 2.5,
                        backgroundColor: '#FFFFFF',
                        borderBottom: index < filteredAndSortedOrders.length - 1 ? '1px solid #E0E0E0' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#F5F5F5',
                        },
                      }}
                      onClick={() => handleViewOrder(order.id)}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 2,
                        }}
                      >
                        {/* Colonne 1: ID et Date */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200 }}>
                          <Avatar
                            sx={{
                              bgcolor: '#DC143C',
                              width: 48,
                              height: 48,
                              fontWeight: 700,
                            }}
                          >
                            #{order.id}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666666', mb: 0.5 }}>
                              {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: fr })}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#999999' }}>
                              {format(new Date(order.createdAt), 'HH:mm', { locale: fr })}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Colonne 2: Montant */}
                        <Box sx={{ minWidth: 150 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: '#DC143C',
                            }}
                          >
                            {Number(order.totalAmount).toFixed(0)} FCFA
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666666' }}>
                            {order.items.length} article{order.items.length > 1 ? 's' : ''}
                          </Typography>
                        </Box>

                        {/* Colonne 3: Statut de paiement */}
                        <Box sx={{ minWidth: 200 }}>
                            <Chip
                            label={getPaymentStatusLabel(order.paymentStatus)}
                              size="small"
                              sx={{
                                backgroundColor: `${getPaymentStatusColor(order.paymentStatus)}15`,
                                color: getPaymentStatusColor(order.paymentStatus),
                                fontWeight: 600,
                              }}
                            />
                          </Box>

                        {/* Colonne 4: Table */}
                          {order.tableNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                            <TableIcon sx={{ fontSize: 18, color: '#666666' }} />
                            <Typography variant="body2" sx={{ color: '#666666' }}>
                              Table {order.tableNumber}
                            </Typography>
                        </Box>
                        )}

                        {/* Colonne 5: Actions */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Voir les détails">
                          <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewOrder(order.id);
                              }}
                            sx={{
                              color: '#DC143C',
                              '&:hover': {
                                backgroundColor: 'rgba(220, 20, 60, 0.1)',
                              },
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                          </Tooltip>
                          {order.paymentStatus !== 'paid' && (
                            <Tooltip title="Traiter le paiement">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPaymentDialog(order);
                                }}
                              sx={{
                                color: '#2E7D32',
                                '&:hover': {
                                  backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                },
                              }}
                            >
                              <PaymentIcon />
                            </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </Box>
                </motion.div>
              ))}
              </Paper>
        </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* FAB */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => navigate('/orders/create')}
        sx={{
          position: 'fixed',
          bottom: { xs: 80, sm: 24 },
          right: 24,
          backgroundColor: '#DC143C',
          boxShadow: '0 4px 12px rgba(220, 20, 60, 0.4)',
          '&:hover': {
            backgroundColor: '#B71C1C',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <AddIcon />
      </Fab>

      {/* Dialog pour voir les détails d'une commande */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          // Nettoyer l'URL quand on ferme le modal
          if (searchParams.get('orderId')) {
            searchParams.delete('orderId');
            setSearchParams(searchParams);
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, backgroundColor: '#FFFFFF' },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#000000', pb: 1 }}>
          Commande #{selectedOrder?.id}
          <Typography variant="body2" sx={{ color: '#666666', fontWeight: 400, mt: 0.5 }}>
          {selectedOrder &&
              format(new Date(selectedOrder.createdAt), 'dd MMMM yyyy à HH:mm', {
              locale: fr,
            })}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#FFFFFF' }}>
          {selectedOrder && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={getPaymentStatusLabel(selectedOrder.paymentStatus)}
                    sx={{
                      backgroundColor: `${getPaymentStatusColor(selectedOrder.paymentStatus)}15`,
                      color: getPaymentStatusColor(selectedOrder.paymentStatus),
                      fontWeight: 600,
                    }}
                  />
                  {selectedOrder.tableNumber && (
                  <Chip
                      icon={<TableIcon />}
                      label={`Table ${selectedOrder.tableNumber}`}
                    sx={{
                        backgroundColor: '#F5F5F5',
                        color: '#666666',
                        fontWeight: 600,
                    }}
                  />
                )}
                </Box>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#000000' }}>
                  Articles
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedOrder.items && selectedOrder.items.map((item: any, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: '#F5F5F5',
                      }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#000000' }}>
                          {item.productName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666666' }}>
                          {item.quantity} × {Number(item.unitPrice).toFixed(0)} FCFA
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#DC143C' }}>
                        {Number(item.totalPrice).toFixed(0)} FCFA
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: '#DC143C15',
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
                  Total:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#DC143C' }}>
                  {Number(selectedOrder.totalAmount).toFixed(0)} FCFA
                </Typography>
              </Box>

              {/* Historique des paiements */}
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#000000' }}>
                  Historique des paiements
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {(() => {
                    const payments = selectedOrder.payments || [];
                    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
                    const totalAmount = Number(selectedOrder.totalAmount);
                    const remaining = totalAmount - totalPaid;

                    return (
                      <>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: '#F5F5F5',
                            border: '1px solid #E0E0E0',
                            mb: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: '#666666' }}>
                              Total commande:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#000000' }}>
                              {totalAmount.toFixed(0)} FCFA
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: '#666666' }}>
                              Total payé:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                              {totalPaid.toFixed(0)} FCFA
                            </Typography>
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#000000' }}>
                              Reste à payer:
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: remaining > 0 ? '#DC143C' : '#2E7D32' }}>
                              {remaining.toFixed(0)} FCFA
                            </Typography>
                          </Box>
                        </Box>

                        {payments.length > 0 ? (
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, color: '#000000', fontSize: '1rem', fontWeight: 600 }}>
                              Historique des paiements
                            </Typography>
                            {payments.map((payment) => (
                              <Box
                                key={payment.id}
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  p: 2,
                                  mb: 1,
                                  borderRadius: 2,
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #E0E0E0',
                                }}
                              >
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#000000' }}>
                                    {payment.paymentMethod === 'cash' ? '💵 Espèces' : '🌊 Wave'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#666666' }}>
                                    {format(new Date(payment.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                                  {Number(payment.amount).toFixed(0)} FCFA
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#666666', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                            Aucun paiement enregistré
                          </Typography>
                        )}
                      </>
                    );
                  })()}
                </Box>
              </Box>

            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={() => {
              if (selectedOrder && 
                  selectedOrder.status !== 'completed' && 
                  selectedOrder.status !== 'cancelled' &&
                  selectedOrder.paymentStatus !== 'paid') {
                setOpenAddItemsDialog(true);
                loadProductsForAddItems();
              }
            }}
            variant="contained"
            disabled={
              !selectedOrder || 
              selectedOrder.status === 'completed' || 
              selectedOrder.status === 'cancelled' ||
              selectedOrder.paymentStatus === 'paid'
            }
            sx={{
              backgroundColor: '#2E7D32',
              color: '#FFFFFF',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: '#1B5E20',
              },
              '&.Mui-disabled': {
                backgroundColor: '#CCCCCC',
                color: '#666666',
              },
            }}
            startIcon={<AddIcon />}
          >
            Ajouter des articles
          </Button>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              color: '#DC143C',
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour le paiement */}
      <Dialog
        open={openPaymentDialog}
        onClose={() => {
          setOpenPaymentDialog(false);
          setPaymentAmount('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, backgroundColor: '#FFFFFF' },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#000000' }}>
          Traiter le paiement
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#FFFFFF' }}>
          {selectedOrder && (
            <Box>
              {(() => {
                const payments = selectedOrder.payments || [];
                const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
                const totalAmount = Number(selectedOrder.totalAmount);
                const remaining = totalAmount - totalPaid;

                return (
                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2,
                        backgroundColor: '#F5F5F5',
                        border: '1px solid #E0E0E0',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666666' }}>
                          Total commande:
              </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#000000' }}>
                          {totalAmount.toFixed(0)} FCFA
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666666' }}>
                          Total payé:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                          {totalPaid.toFixed(0)} FCFA
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#000000' }}>
                          Reste à payer:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: remaining > 0 ? '#DC143C' : '#2E7D32' }}>
                          {remaining.toFixed(0)} FCFA
                        </Typography>
                      </Box>
                    </Box>
                    <TextField
                  fullWidth
                      label="Montant à payer"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={remaining > 0 ? remaining.toFixed(0) : '0'}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
                      }}
                  sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                        },
                      }}
                    />
                    {paymentAmount && (
                      <Typography variant="body2" sx={{ color: '#666666' }}>
                        Nouveau reste à payer: {Math.max(0, remaining - parseFloat(paymentAmount || '0')).toFixed(0)} FCFA
                      </Typography>
                    )}
                  </Box>
                );
              })()}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleProcessPayment('cash')}
                  disabled={loading}
                  size="large"
                  sx={{
                    py: 2,
                    borderColor: '#DC143C',
                    color: '#DC143C',
                    fontWeight: 600,
                    borderRadius: 2,
                    fontSize: '1rem',
                    '&:hover': {
                      borderColor: '#B71C1C',
                      backgroundColor: 'rgba(220, 20, 60, 0.05)',
                    },
                  }}
                >
                  💵 Espèces
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleProcessPayment('wave')}
                  disabled={loading}
                  size="large"
                  sx={{
                    py: 2,
                    borderColor: '#DC143C',
                    color: '#DC143C',
                    fontWeight: 600,
                    borderRadius: 2,
                    fontSize: '1rem',
                    '&:hover': {
                      borderColor: '#B71C1C',
                      backgroundColor: 'rgba(220, 20, 60, 0.05)',
                    },
                  }}
                >
                  🌊 Wave
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setOpenPaymentDialog(false);
              setPaymentAmount('');
            }}
            sx={{
              color: '#666666',
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            Annuler
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour ajouter des articles */}
      <Dialog
        open={openAddItemsDialog}
        onClose={() => {
          setOpenAddItemsDialog(false);
          setItemsToAdd([]);
          setSelectedCategoryId(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#000000', pb: 1 }}>
          Ajouter des articles à la commande #{selectedOrder?.id}
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#FFFFFF' }}>
          {/* Filtres par catégorie */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                label="Toutes"
                onClick={() => setSelectedCategoryId(null)}
                sx={{
                  backgroundColor: selectedCategoryId === null ? '#DC143C' : '#F5F5F5',
                  color: selectedCategoryId === null ? '#FFFFFF' : '#666666',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  onClick={() => setSelectedCategoryId(category.id)}
                  sx={{
                    backgroundColor: selectedCategoryId === category.id ? '#DC143C' : '#F5F5F5',
                    color: selectedCategoryId === category.id ? '#FFFFFF' : '#666666',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Liste des produits */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {filteredProducts.map((product) => (
              <Grid item xs={6} sm={4} md={3} key={product.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 2,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                  onClick={() => handleProductClickForAdd(product)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#000000', mb: 0.5 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#DC143C' }}>
                      {Number(product.price).toFixed(0)} FCFA
                    </Typography>
                    {product.hasStock && (
                      <Typography variant="caption" sx={{ color: '#666666' }}>
                        Stock: {product.stockQuantity}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Articles sélectionnés */}
          {itemsToAdd.length > 0 && (
            <Box sx={{ mt: 3, p: 2, borderRadius: 2, backgroundColor: '#F5F5F5' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#000000' }}>
                Articles à ajouter:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {itemsToAdd.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 1,
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#000000' }}>
                        {item.productName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666666' }}>
                          {item.quantity} × {Number(item.unitPrice).toFixed(0)} FCFA
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC143C' }}>
                      {Number(item.totalPrice).toFixed(0)} FCFA
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
                  Total:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#DC143C' }}>
                  {itemsToAdd.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(0)} FCFA
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setOpenAddItemsDialog(false);
              setItemsToAdd([]);
              setSelectedCategoryId(null);
            }}
            sx={{
              color: '#666666',
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleAddItemsToOrder}
            variant="contained"
            disabled={itemsToAdd.length === 0 || loading}
            sx={{
              backgroundColor: '#2E7D32',
              color: '#FFFFFF',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: '#1B5E20',
              },
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour sélectionner la quantité */}
      <Dialog
        open={openQuantityDialog}
        onClose={() => {
          setOpenQuantityDialog(false);
          setSelectedProduct(null);
          setQuantity(1);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#000000' }}>
          {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#000000' }}>
              Prix unitaire: {selectedProduct ? Number(selectedProduct.price).toFixed(0) : '0'} FCFA
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                sx={{
                  border: '1px solid #E0E0E0',
                  color: '#DC143C',
                }}
              >
                <RemoveIcon />
              </IconButton>
              <TextField
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, val));
                }}
                inputProps={{
                  min: 1,
                  style: { textAlign: 'center', fontWeight: 600 },
                }}
                sx={{ flex: 1 }}
              />
              <IconButton
                onClick={() => setQuantity(quantity + 1)}
                sx={{
                  border: '1px solid #E0E0E0',
                  color: '#DC143C',
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
                Total:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#DC143C' }}>
                {((selectedProduct ? Number(selectedProduct.price) : 0) * quantity).toFixed(0)} FCFA
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setOpenQuantityDialog(false);
              setSelectedProduct(null);
              setQuantity(1);
            }}
            sx={{
              color: '#666666',
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleAddToItemsList}
            variant="contained"
            sx={{
              backgroundColor: '#DC143C',
              color: '#FFFFFF',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: '#B71C1C',
              },
            }}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </PageTransition>
  );
};

export default OrdersScreen;
