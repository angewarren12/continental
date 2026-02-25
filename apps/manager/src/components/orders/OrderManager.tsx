import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ContentCopy as DuplicateIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderItem } from '@shared/types/order';
import { User } from '@shared/types/user';
import PageTransition from '../ui/PageTransition';
import { staggerContainer, staggerItem } from '../../constants/animations';

interface OrderManagerProps {
  initialOrders?: Order[];
  onOrderCreate?: (order: Order) => void;
  onOrderUpdate?: (orderId: number, updates: Partial<Order>) => void;
  onOrderDelete?: (orderId: number) => void;
  readOnly?: boolean;
}

type ViewMode = 'list' | 'create' | 'edit' | 'history';

const OrderManager: React.FC<OrderManagerProps> = ({
  initialOrders = [],
  onOrderCreate,
  onOrderUpdate,
  onOrderDelete,
  readOnly = false,
}) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState<Order | null>(null);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const handleCreateOrder = () => {
    setViewMode('create');
    setSelectedOrder(null);
  };

  const handleEditOrder = (order: Order) => {
    if (readOnly) return;
    setSelectedOrder(order);
    setViewMode('edit');
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewMode('edit'); // Utilise le mode edit pour la visualisation
  };

  const handleDuplicateOrder = async (order: Order) => {
    if (readOnly) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Appeler l'API de duplication
      // const duplicatedOrder = await orderService.duplicateOrder(order.id);
      console.log('Duplication de la commande:', order.id);
      
      // setOrders([...orders, duplicatedOrder]);
      // if (onOrderCreate) onOrderCreate(duplicatedOrder);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la duplication de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (readOnly) return;
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la commande #${order.id} ?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Appeler l'API de suppression
      // await orderService.deleteOrder(order.id);
      console.log('Suppression de la commande:', order.id);
      
      setOrders(orders.filter(o => o.id !== order.id));
      if (onOrderDelete) onOrderDelete(order.id);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderHistory = (order: Order) => {
    setSelectedOrderForHistory(order);
    setHistoryDialogOpen(true);
  };

  const handleOrderSave = (orderData: any) => {
    if (selectedOrder) {
      // Mise à jour
      const updatedOrders = orders.map(o => 
        o.id === selectedOrder.id ? { ...o, ...orderData } : o
      );
      setOrders(updatedOrders);
      if (onOrderUpdate) onOrderUpdate(selectedOrder.id, orderData);
    } else {
      // Création
      const newOrder = { ...orderData, id: Date.now() }; // Temporaire
      setOrders([...orders, newOrder]);
      if (onOrderCreate) onOrderCreate(newOrder);
    }
    
    setViewMode('list');
    setSelectedOrder(null);
  };

  const handleOrderCancel = () => {
    setViewMode('list');
    setSelectedOrder(null);
    setError(null);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Appeler l'API de rafraîchissement
      // const refreshedOrders = await orderService.getOrders();
      console.log('Rafraîchissement des commandes');
      
      // setOrders(refreshedOrders);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du rafraîchissement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'preparing': return '#2196F3';
      case 'ready': return '#4CAF50';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'paid': return 'Payée';
      case 'failed': return 'Échouée';
      default: return status;
    }
  };

  // Design tokens temporaires
  const designTokens = {
    colors: {
      text: {
        primary: '#000000',
        secondary: '#666666',
      },
      primary: {
        main: '#DC143C',
        dark: '#8B0000',
      },
      info: {
        main: '#2196F3',
      },
      warning: {
        main: '#FF9800',
      },
      error: {
        main: '#F44336',
      },
    },
    transitions: {
      normal: 'all 0.2s ease-in-out',
    },
    shadows: {
      hover: '0 4px 12px rgba(0,0,0,0.15)',
    },
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <PageTransition>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
              <IconButton onClick={handleOrderCancel} sx={{ color: '#DC143C' }}>
                <Tooltip title="Retour à la liste">
                  <EditIcon />
                </Tooltip>
              </IconButton>
              
              <Typography variant="h4" sx={{ color: designTokens.colors.text.primary, fontWeight: 600 }}>
                {selectedOrder ? `Modifier la commande #${selectedOrder.id}` : 'Nouvelle commande'}
              </Typography>
            </Box>
          </motion.div>

          {/* Order Builder Temporaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedOrder ? `Modifier la commande #${selectedOrder.id}` : 'Nouvelle commande'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Order Builder - En cours de développement...
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={handleOrderCancel}>
                  Annuler
                </Button>
                <Button variant="contained" onClick={handleOrderCancel}>
                  Retour
                </Button>
              </Box>
            </Box>
          </motion.div>
        </Box>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Box sx={{ p: 3, pb: 10 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ color: designTokens.colors.text.primary, fontWeight: 600 }}>
              Gestion des Commandes
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!readOnly && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateOrder}
                  sx={{
                    bgcolor: designTokens.colors.primary.main,
                    '&:hover': { bgcolor: designTokens.colors.primary.dark },
                  }}
                >
                  Nouvelle Commande
                </Button>
              )}
              
              <Tooltip title="Rafraîchir">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ color: designTokens.colors.primary.main }} />
          </Box>
        )}

        {/* Orders List */}
        {!loading && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.1 }}
          >
            <Grid container spacing={3}>
              {orders.map((order, index) => (
                <Grid item xs={12} sm={6} lg={4} key={order.id}>
                  <motion.div variants={staggerItem} custom={index}>
                    <Card
                      sx={{
                        height: '100%',
                        cursor: readOnly ? 'default' : 'pointer',
                        transition: designTokens.transitions.normal,
                        '&:hover': !readOnly ? {
                          transform: 'translateY(-4px)',
                          boxShadow: designTokens.shadows.hover,
                        } : {},
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        {/* Order Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: designTokens.colors.text.primary }}>
                              Commande #{order.id}
                            </Typography>
                            <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                              {new Date(order.createdAt).toLocaleString('fr-FR')}
                            </Typography>
                          </Box>
                          
                          {/* Status */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                            <Box
                              sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: getStatusColor(order.status),
                                color: 'white',
                                textAlign: 'center',
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                                {getStatusLabel(order.status)}
                              </Typography>
                            </Box>
                            
                            <Box
                              sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: order.paymentStatus === 'paid' ? '#4CAF50' : '#FF9800',
                                color: 'white',
                                textAlign: 'center',
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                                {getPaymentStatusLabel(order.paymentStatus)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Order Info */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary, mb: 1 }}>
                            Client: {order.client?.name || 'Non spécifié'}
                          </Typography>
                          {order.tableNumber && (
                            <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary, mb: 1 }}>
                              Table: {order.tableNumber}
                            </Typography>
                          )}
                          <Typography variant="h6" sx={{ color: designTokens.colors.primary.main, fontWeight: 600 }}>
                            {order.totalAmount.toFixed(0)} FCFA
                          </Typography>
                        </Box>

                        {/* Actions */}
                        {!readOnly && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Voir les détails">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewOrder(order)}
                                  sx={{ color: designTokens.colors.primary.main }}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Historique">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOrderHistory(order)}
                                  sx={{ color: designTokens.colors.info.main }}
                                >
                                  <HistoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {order.status !== 'completed' && order.status !== 'cancelled' && (
                                <Tooltip title="Modifier">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditOrder(order)}
                                    sx={{ color: designTokens.colors.warning.main }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <Tooltip title="Dupliquer">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDuplicateOrder(order)}
                                  sx={{ color: designTokens.colors.info.main }}
                                >
                                  <DuplicateIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              {order.status === 'pending' && (
                                <Tooltip title="Supprimer">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteOrder(order)}
                                    sx={{ color: designTokens.colors.error.main }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}

        {/* Floating Action Button */}
        {!readOnly && (
          <Fab
            color="primary"
            aria-label="Nouvelle commande"
            onClick={handleCreateOrder}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              bgcolor: designTokens.colors.primary.main,
              '&:hover': { bgcolor: designTokens.colors.primary.dark },
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* History Dialog */}
        <Dialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Historique de la commande #{selectedOrderForHistory?.id}
          </DialogTitle>
          <DialogContent>
            {selectedOrderForHistory && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Historique de la commande #{selectedOrderForHistory.id}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Order History - En cours de développement...
                </Typography>
                <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    • Commande créée le {new Date(selectedOrderForHistory.createdAt).toLocaleString('fr-FR')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                    • Statut actuel: {getStatusLabel(selectedOrderForHistory.status)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                    • Montant total: {selectedOrderForHistory.totalAmount.toFixed(0)} FCFA
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryDialogOpen(false)}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageTransition>
  );
};

export default OrderManager;
