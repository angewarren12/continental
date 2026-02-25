import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  LocalBar as StockIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  ShoppingCart as CartIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  ArrowForward as ArrowForwardIcon,
  Restaurant as RestaurantIcon,
  Payment as PaymentIcon,
  Add as AddIcon,
  LocalDining as LocalDiningIcon,
} from '@mui/icons-material';
import { getOrders } from '@shared/api/orders';
import { getAllStocks } from '@shared/api/stock';
import { getAllUsers } from '@shared/api/users';
import { getProducts } from '@shared/api/products';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuthState } from '../hooks/useAuthState';
import AnimatedCard from '../components/animations/AnimatedCard';
import StatCard from '../components/ui/StatCard';
import { staggerContainer, staggerItem, slideUp } from '../constants/animations';
import { designTokens } from '../design-tokens';
import { Order, PaymentStatus } from '@shared/types/order';
import { Stock } from '@shared/types/stock';
import { Product } from '@shared/types/product';


const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingPayments: 0,
    lowStockItems: 0,
    totalClients: 0,
    preparingOrders: 0,
    readyOrders: 0,
    todayDishesOrdered: 0,
  });
  const [topDishes, setTopDishes] = useState<Array<{ name: string; count: number }>>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Array<Stock & { productName?: string; product?: Product }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Charger toutes les données en parallèle
      const [orders, stocks, users, products] = await Promise.all([
        getOrders({}),
        getAllStocks(),
        getAllUsers(),
        getProducts({ isActive: true }),
      ]);

      // Filtrer les commandes d'aujourd'hui
      const todayOrders = orders.filter(
        (o) => new Date(o.createdAt) >= today && new Date(o.createdAt) < tomorrow
      );

      // Calculer les revenus en incluant tous les paiements (partiels ou complets)
      const getPaidAmount = (order: Order): number => {
        if (!order.payments || order.payments.length === 0) {
          return 0;
        }
        return order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      };

      const todayRevenue = todayOrders.reduce((sum, order) => {
        return sum + getPaidAmount(order);
      }, 0);

      const preparingOrders = orders.filter((o) => o.status === 'preparing').length;
      const readyOrders = orders.filter((o) => o.status === 'ready').length;

      // Paiements en attente
      const pendingPayments = orders.filter((o) => o.paymentStatus === 'pending').length;

      // Stock faible (moins de 10 unités) - adapter selon le type de produit
      const lowStock = stocks.filter((s) => {
        const product = products.find((p) => p.id === s.productId);
        if (!product) return false;
        
        let totalQuantity = s.quantity;
        if (product.productType === 'cigarette') {
          const packets = s.quantityPackets || 0;
          const units = s.quantityUnits || 0;
          totalQuantity = packets * (product.conversionFactor || 20) + units;
        } else if (product.productType === 'egg') {
          const plates = s.quantityPlates || 0;
          const units = s.quantityUnits || 0;
          totalQuantity = plates * (product.conversionFactor || 30) + units;
        }
        
        return totalQuantity < 10;
      });

      // Clients
      const totalClients = users.filter((u) => u.role === 'client').length;

      // Calculer les plats commandés aujourd'hui
      const dishCounts = new Map<string, number>();
      let todayDishesOrdered = 0;
      
      todayOrders.forEach((order) => {
        order.items?.forEach((item: any) => {
          const product = products.find((p) => p.id === item.productId);
          if (product?.productType === 'dish' && !item.isSupplement) {
            todayDishesOrdered += item.quantity;
            const currentCount = dishCounts.get(item.productName) || 0;
            dishCounts.set(item.productName, currentCount + item.quantity);
          }
        });
      });

      // Top 5 plats commandés aujourd'hui
      const topDishesArray = Array.from(dishCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Commandes récentes (5 dernières)
      const recent = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue,
        pendingPayments,
        lowStockItems: lowStock.length,
        totalClients,
        preparingOrders,
        readyOrders,
        todayDishesOrdered,
      });

      setTopDishes(topDishesArray);
      setProducts(products);

      setRecentOrders(recent);
      setLowStockProducts(
        lowStock
          .map((s) => {
            const product = products.find((p) => p.id === s.productId);
            return { ...s, productName: product?.name || 'Produit inconnu', product };
          })
          .slice(0, 5)
      );
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour le statut de paiement
  const getPaymentStatusColor = (status: PaymentStatus) => {
    return status === 'paid' ? '#2E7D32' : status === 'failed' ? '#DC143C' : '#FF9800';
  };

  const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'failed':
        return 'Échoué';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  const statCards = [
    {
      title: 'Commandes aujourd\'hui',
      value: stats.todayOrders,
      icon: <ReceiptIcon />,
      color: designTokens.colors.primary.main,
      onClick: () => navigate('/orders'),
      subtitle: 'Aujourd\'hui',
    },
    {
      title: 'Revenus aujourd\'hui',
      value: `${Number(stats.todayRevenue).toFixed(0)} FCFA`,
      icon: <MoneyIcon />,
      color: designTokens.colors.status.success,
      subtitle: 'Payé',
    },
    {
      title: 'Paiement en attente',
      value: stats.pendingPayments,
      icon: <PaymentIcon />,
      color: designTokens.colors.status.warning,
      onClick: () => navigate('/orders'),
      subtitle: 'Non payé',
    },
    {
      title: 'Total clients',
      value: stats.totalClients,
      icon: <PersonIcon />,
      color: designTokens.colors.status.info,
      onClick: () => navigate('/clients'),
    },
    {
      title: 'Plats commandés',
      value: stats.todayDishesOrdered,
      icon: <LocalDiningIcon />,
      color: '#9C27B0',
      subtitle: 'Aujourd\'hui',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#DC143C', mb: 2 }} size={48} />
        <Typography variant="body1" sx={{ color: '#666666' }}>
          Chargement des données...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Section Bienvenue */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatedCard delay={0} sx={{ mb: 3, backgroundColor: designTokens.colors.background.paper, borderRadius: designTokens.borderRadius.large }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: designTokens.borderRadius.large,
                      backgroundColor: designTokens.colors.primary.main,
                      color: designTokens.colors.primary.contrast,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 40 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: designTokens.colors.text.primary,
                        mb: 0.5,
                        fontSize: designTokens.typography.h4.fontSize,
                      }}
                    >
                      Bienvenue, {user.name} ! 👋
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={user.role === 'manager' ? 'Gestionnaire' : 'Client'}
                        size="small"
                        sx={{
                          bgcolor: designTokens.colors.primary.main,
                          color: designTokens.colors.primary.contrast,
                          fontWeight: 600,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: designTokens.colors.text.secondary,
                        }}
                      >
                        {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </AnimatedCard>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Alert
            severity="error"
            sx={{
              mb: 3,
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

      {/* Statistiques principales */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: designTokens.colors.text.primary,
              fontSize: designTokens.typography.h4.fontSize,
            }}
          >
            Vue d'ensemble
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/orders/create')}
            sx={{
              backgroundColor: designTokens.colors.primary.main,
              color: '#FFFFFF',
              borderRadius: 2,
              px: { xs: 2.5, sm: 3 },
              py: { xs: 1.25, sm: 1.5 },
              fontWeight: 700,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(189, 15, 59, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: designTokens.colors.primary.light || '#e01a4f',
                boxShadow: '0 6px 20px rgba(189, 15, 59, 0.4)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            Prise de commande
          </Button>
        </Box>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <Grid container spacing={3}>
          {statCards.map((card, index) => {
            return (
              <Grid 
                item 
                xs={6} 
                sm={6} 
                md={6} 
                key={index}
              >
                <StatCard {...card} delay={index * 0.1} />
              </Grid>
            );
          })}
        </Grid>
      </motion.div>

      {/* Plats les plus commandés */}
      {topDishes.length > 0 && (
        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <AnimatedCard delay={0.5} sx={{ mt: 3, borderRadius: designTokens.borderRadius.large, backgroundColor: designTokens.colors.background.paper, boxShadow: designTokens.shadows.card }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: designTokens.colors.text.primary }}>
                  Plats les plus commandés aujourd'hui
                </Typography>
                <LocalDiningIcon sx={{ color: '#9C27B0', fontSize: 28 }} />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List sx={{ p: 0 }}>
                {topDishes.map((dish, index) => (
                  <ListItem
                    key={dish.name}
                    sx={{
                      px: 0,
                      py: 1.5,
                      borderRadius: 2,
                      backgroundColor: '#FFFFFF',
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: '#9C27B015',
                          color: '#9C27B0',
                          fontWeight: 700,
                          minWidth: 32,
                          textAlign: 'center',
                        }}
                      >
                        {index + 1}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#000000' }}>
                          {dish.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: '#666666', mt: 0.5 }}>
                          {dish.count} commande{dish.count > 1 ? 's' : ''}
                        </Typography>
                      }
                    />
                    <Chip
                      label={`${dish.count}×`}
                      size="small"
                      sx={{
                        bgcolor: '#9C27B0',
                        color: '#FFFFFF',
                        fontWeight: 700,
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </AnimatedCard>
        </motion.div>
      )}

      {/* Commandes récentes et Stock faible */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Commandes récentes */}
        <Grid item xs={12} md={6}>
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.6 }}
          >
            <AnimatedCard delay={0.6} sx={{ height: '100%', borderRadius: designTokens.borderRadius.large, backgroundColor: designTokens.colors.background.paper, boxShadow: designTokens.shadows.card }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: designTokens.colors.text.primary }}>
                    Commandes récentes
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => navigate('/orders')}
                    sx={{ color: designTokens.colors.primary.main }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {recentOrders.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ReceiptIcon sx={{ fontSize: 48, color: '#CCCCCC', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#666666' }}>
                      Aucune commande récente
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {recentOrders.map((order, index) => (
                      <React.Fragment key={order.id}>
                        <ListItem
                          sx={{
                            px: 0,
                            py: 1.5,
                            cursor: 'pointer',
                            borderRadius: 2,
                            backgroundColor: '#FFFFFF',
                            '&:hover': {
                              backgroundColor: '#F5F5F5',
                            },
                          }}
                          onClick={() => navigate(`/orders?orderId=${order.id}`)}
                        >
                          <ListItemIcon>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                backgroundColor: '#DC143C15',
                                color: '#DC143C',
                              }}
                            >
                              <ReceiptIcon fontSize="small" />
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#000000' }}>
                                  Commande #{order.id}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#DC143C', fontSize: '0.875rem' }}>
                                  {Number(order.totalAmount).toFixed(0)} FCFA
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box component="div" sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                <Chip
                                  label={getPaymentStatusLabel(order.paymentStatus)}
                                  size="small"
                                  sx={{
                                    bgcolor: `${getPaymentStatusColor(order.paymentStatus)}15`,
                                    color: getPaymentStatusColor(order.paymentStatus),
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                  }}
                                />
                                <Typography variant="caption" component="span" sx={{ color: '#666666', alignSelf: 'center' }}>
                                  {formatDistanceToNow(new Date(order.createdAt), {
                                    addSuffix: true,
                                    locale: fr,
                                  })}
                                </Typography>
                              </Box>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItem>
                        {index < recentOrders.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </AnimatedCard>
          </motion.div>
        </Grid>

        {/* Stock faible */}
        <Grid item xs={12} md={6}>
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.7 }}
          >
            <AnimatedCard delay={0.7} sx={{ height: '100%', borderRadius: designTokens.borderRadius.large, backgroundColor: designTokens.colors.background.paper, boxShadow: designTokens.shadows.card }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: designTokens.colors.text.primary }}>
                    Stock faible
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => navigate('/stock')}
                    sx={{ color: designTokens.colors.primary.main }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {lowStockProducts.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: '#2E7D32', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#666666' }}>
                      Tous les stocks sont suffisants
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {lowStockProducts.map((stock, index) => {
                      const product = products.find((p) => p.id === stock.productId);
                      let totalQuantity = stock.quantity;
                      let displayText = `${stock.quantity} unités`;
                      
                      if (product?.productType === 'cigarette') {
                        const packets = stock.quantityPackets || 0;
                        const units = stock.quantityUnits || 0;
                        totalQuantity = packets * (product.conversionFactor || 20) + units;
                        if (packets > 0 && units > 0) {
                          displayText = `${packets} paquet${packets > 1 ? 's' : ''} (${units} cigarettes)`;
                        } else if (packets > 0) {
                          displayText = `${packets} paquet${packets > 1 ? 's' : ''}`;
                        } else {
                          displayText = `${units} cigarettes`;
                        }
                      } else if (product?.productType === 'egg') {
                        const plates = stock.quantityPlates || 0;
                        const units = stock.quantityUnits || 0;
                        totalQuantity = plates * (product.conversionFactor || 30) + units;
                        if (plates > 0 && units > 0) {
                          displayText = `${plates} plaquette${plates > 1 ? 's' : ''} (${units} œufs)`;
                        } else if (plates > 0) {
                          displayText = `${plates} plaquette${plates > 1 ? 's' : ''}`;
                        } else {
                          displayText = `${units} œufs`;
                        }
                      }
                      
                      const percentage = (totalQuantity / 10) * 100;
                      return (
                        <React.Fragment key={stock.productId}>
                          <ListItem sx={{ px: 0, py: 1.5, backgroundColor: '#FFFFFF', '&:hover': { backgroundColor: '#F5F5F5' } }}>
                            <ListItemIcon>
                              <Box
                                sx={{
                                  p: 1,
                                  borderRadius: 2,
                                  backgroundColor: '#FF980015',
                                  color: '#FF9800',
                                }}
                              >
                                <WarningIcon fontSize="small" />
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#000000' }}>
                                  {(stock as any).productName}
                                </Typography>
                              }
                              secondary={
                                <Box component="div" sx={{ mt: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" component="span" sx={{ color: '#666666' }}>
                                      Stock: {displayText}
                                    </Typography>
                                    <Typography variant="caption" component="span" sx={{ color: '#DC143C', fontWeight: 600 }}>
                                      {percentage.toFixed(0)}%
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(percentage, 100)}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      backgroundColor: '#F5F5F5',
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: percentage < 30 ? '#DC143C' : '#FF9800',
                                      },
                                    }}
                                  />
                                </Box>
                              }
                              secondaryTypographyProps={{ component: 'div' }}
                            />
                          </ListItem>
                          {index < lowStockProducts.length - 1 && <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </AnimatedCard>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardScreen;
