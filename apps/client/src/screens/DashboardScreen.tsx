import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingBag as ShoppingBagIcon,
  Restaurant as RestaurantIcon,
  LocalBar as LocalBarIcon,
  Cake as CakeIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { getClientOrders } from '@shared/api/orders';
import { Order } from '@shared/types/order';
import { useAuth } from '../contexts/AuthContext';
import { useRefresh } from '../contexts/RefreshContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registerRefresh, unregisterRefresh } = useRefresh();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    recentOrders: [] as Order[],
    newOrdersThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculer le montant total payé pour une commande
  const getPaidAmount = (order: Order): number => {
    if (!order.payments || order.payments.length === 0) {
      return 0;
    }
    return order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  };

  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const orders = await getClientOrders(user.id);
      
      const totalOrders = orders.length;
      // Calculer le total de tous les paiements (partiels ou complets)
      const totalSpent = orders.reduce((sum, order) => {
        return sum + getPaidAmount(order);
      }, 0);
      
      // Calculer les nouvelles commandes (créées ce mois)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      const newOrdersThisMonth = orders.filter(
        (o) => new Date(o.createdAt) >= currentMonth
      ).length;
      
      const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setStats({
        totalOrders,
        totalSpent: totalSpent,
        recentOrders,
        newOrdersThisMonth,
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, loadStats]);

  useEffect(() => {
    registerRefresh(loadStats);
    return () => {
      unregisterRefresh();
    };
  }, [registerRefresh, unregisterRefresh, loadStats]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getOrderIcon = (order: Order) => {
    // Déterminer l'icône en fonction du type de produits dans la commande
    const productNames = order.items.map(item => item.productName.toLowerCase()).join(' ');
    if (productNames.includes('menu') || productNames.includes('dégustation')) {
      return <RestaurantIcon />;
    } else if (productNames.includes('cocktail') || productNames.includes('boisson')) {
      return <LocalBarIcon />;
    } else if (productNames.includes('gâteau') || productNames.includes('dessert')) {
      return <CakeIcon />;
    }
    return <ReceiptIcon />;
  };

  const statCards = [
    {
      title: 'TOTAL DÉPENSÉ',
      value: `${Number(stats.totalSpent).toLocaleString('fr-FR')} FCFA`,
      icon: <MoneyIcon />,
      bgColor: '#2E7D32',
      trend: '+5.2% ce mois',
      onClick: () => navigate('/orders'),
    },
    {
      title: 'COMMANDES',
      value: stats.totalOrders,
      icon: <ShoppingBagIcon />,
      bgColor: '#bd0f3b',
      trend: stats.newOrdersThisMonth > 0 ? `+${stats.newOrdersThisMonth} nouvelles` : 'Aucune nouvelle',
      onClick: () => navigate('/orders'),
    },
  ];

  return (
    <Box sx={{ pb: { xs: 2, sm: 3 } }}>
      {/* Header Rouge avec Bienvenue */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box
            sx={{
              backgroundColor: '#bd0f3b',
              borderRadius: { xs: '0 0 24px 24px', sm: '0 0 32px 32px' },
              px: { xs: 2.5, sm: 3 },
              pt: { xs: 3, sm: 4 },
              pb: { xs: 2.5, sm: 3 },
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 500,
                    mb: 0.5,
                  }}
                >
                  Bon retour parmi nous,
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Bienvenue, {user.name} !
                </Typography>
              </Box>
              <IconButton
                sx={{
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  },
                }}
              >
                <NotificationsIcon />
              </IconButton>
            </Box>
          </Box>
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

      {/* Cartes Statistiques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Grid container spacing={2.5} sx={{ mb: 3, px: { xs: 2.5, sm: 3 } }}>
          {statCards.map((card, index) => (
            <Grid item xs={6} key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: { xs: '180px', sm: '200px', md: '220px' },
                    cursor: 'pointer',
                    backgroundColor: card.bgColor,
                    borderRadius: 3,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': { 
                      transform: 'translateY(-6px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    },
                    '&:active': {
                      transform: 'translateY(-3px)',
                    },
                  }}
                  onClick={card.onClick}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Box
                        sx={{
                          width: { xs: 48, sm: 56 },
                          height: { xs: 48, sm: 56 },
                          borderRadius: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        {React.cloneElement(card.icon, {
                          sx: { 
                            fontSize: { xs: 28, sm: 32 },
                            color: '#FFFFFF',
                          }
                        })}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: 700,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'block',
                          mb: 1.5,
                        }}
                      >
                        {card.title}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography 
                        variant="h3" 
                        component="div" 
                        sx={{ 
                          fontWeight: 900, 
                          color: '#FFFFFF', 
                          mb: 1, 
                          fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                          lineHeight: 1,
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {card.value}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingUpIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#FFFFFF' }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.95)',
                            fontWeight: 600,
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          }}
                        >
                          {card.trend}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Section Dernières commandes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Box sx={{ px: { xs: 2.5, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 800, 
                color: '#000000', 
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
              }}
            >
              Dernières commandes
            </Typography>
            <Button
              onClick={() => navigate('/orders')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                color: '#bd0f3b',
                fontWeight: 700,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                textTransform: 'none',
                minWidth: 'auto',
                px: 1,
                '&:hover': {
                  backgroundColor: 'rgba(189, 15, 59, 0.08)',
                },
              }}
            >
              Voir tout
            </Button>
          </Box>

          {stats.recentOrders.length === 0 ? (
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                border: '1px solid #F0F0F0',
              }}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <ReceiptIcon sx={{ fontSize: 64, color: '#CCCCCC', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#666666', fontWeight: 600 }}>
                  Aucune commande pour le moment
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats.recentOrders.map((order, index) => {
                const orderIcon = getOrderIcon(order);
                const firstItem = order.items[0];
                const orderDate = new Date(order.createdAt);
                const isToday = orderDate.toDateString() === new Date().toDateString();
                const isYesterday = orderDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
                
                let dateText = '';
                if (isToday) {
                  dateText = `Aujourd'hui, ${format(orderDate, 'HH:mm', { locale: fr })}`;
                } else if (isYesterday) {
                  dateText = `Hier, ${format(orderDate, 'HH:mm', { locale: fr })}`;
                } else {
                  dateText = format(orderDate, 'd MMM, HH:mm', { locale: fr });
                }

                // Fonction pour obtenir le label du statut de paiement
                const getPaymentStatusLabel = (order: Order): string => {
                  const paid = getPaidAmount(order);
                  const total = Number(order.totalAmount);
                  
                  if (paid >= total) {
                    return 'PAYÉ';
                  } else if (paid > 0) {
                    return 'PARTIELLEMENT PAYÉ';
                  } else {
                    return 'NON PAYÉ';
                  }
                };

                // Fonction pour obtenir les couleurs du statut de paiement
                const getPaymentStatusColor = (order: Order) => {
                  const paid = getPaidAmount(order);
                  const total = Number(order.totalAmount);
                  
                  if (paid >= total) {
                    return { bg: '#2E7D32', text: '#FFFFFF' };
                  } else if (paid > 0) {
                    return { bg: '#FF9800', text: '#FFFFFF' };
                  } else {
                    return { bg: '#DC143C', text: '#FFFFFF' };
                  }
                };

                const statusColors = getPaymentStatusColor(order);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        borderRadius: 3,
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                        border: '1px solid #F0F0F0',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                          borderColor: '#bd0f3b',
                        },
                      }}
                      onClick={() => navigate('/orders')}
                    >
                      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                          <Box
                            sx={{
                              width: { xs: 48, sm: 56 },
                              height: { xs: 48, sm: 56 },
                              borderRadius: 2,
                              backgroundColor: '#bd0f3b15',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#bd0f3b',
                              flexShrink: 0,
                            }}
                          >
                            {React.cloneElement(orderIcon, {
                              sx: { fontSize: { xs: 24, sm: 28 } }
                            })}
                          </Box>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: '#000000',
                                fontSize: { xs: '1rem', sm: '1.125rem' },
                                mb: 0.5,
                                lineHeight: 1.3,
                              }}
                            >
                              {firstItem?.productName || `Commande #${order.id}`}
                              {order.items.length > 1 && ` x${order.items.length}`}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#999999',
                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                mb: 1.5,
                              }}
                            >
                              {dateText}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 800,
                                  color: '#bd0f3b',
                                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                                }}
                              >
                                {Number(order.totalAmount).toLocaleString('fr-FR')} FCFA
                              </Typography>
                              <Chip
                                label={getPaymentStatusLabel(order)}
                                size="small"
                                sx={{
                                  bgcolor: statusColors.bg,
                                  color: statusColors.text,
                                  fontWeight: 700,
                                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                  height: 24,
                                  px: 1,
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </Box>
          )}
        </Box>
      </motion.div>
    </Box>
  );
};

export default DashboardScreen;
