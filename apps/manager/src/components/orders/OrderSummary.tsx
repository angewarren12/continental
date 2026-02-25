import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  IconButton,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderItem } from '@shared/types/order';
import { User } from '@shared/types/user';
import { staggerContainer, staggerItem } from '../../constants/animations';

interface OrderSummaryProps {
  order: Order;
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: number) => void;
  onUpdateQuantity?: (itemId: number, newQuantity: number) => void;
  onAddItem?: () => void;
  readOnly?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

interface SupplementInfo {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  order,
  onEdit,
  onDelete,
  onUpdateQuantity,
  onAddItem,
  readOnly = false,
  showActions = true,
  compact = false,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      success: {
        main: '#4CAF50',
      },
      error: {
        main: '#F44336',
      },
      warning: {
        main: '#FF9800',
      },
      info: {
        main: '#2196F3',
      },
    },
    transitions: {
      normal: 'all 0.2s ease-in-out',
    },
    shadows: {
      hover: '0 4px 12px rgba(0,0,0,0.15)',
    },
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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

  const toggleItemExpansion = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleQuantityUpdate = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      setError('La quantité doit être supérieure à 0');
      return;
    }

    try {
      // Mettre à jour la quantité du produit ET des suppléments associés
      if (onUpdateQuantity) {
        await onUpdateQuantity(itemId, newQuantity);
        setSuccess('Quantité mise à jour avec succès');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de la quantité');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la commande #${order.id} ?`)) {
      return;
    }

    try {
      if (onDelete) {
        await onDelete(order.id);
        setSuccess('Commande supprimée avec succès');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de la commande');
    }
  };

  const groupSupplements = (item: OrderItem): SupplementInfo[] => {
    // Simulation - à remplacer avec les vrais données de suppléments
    const supplements: SupplementInfo[] = [];
    
    // Pour l'exemple, on suppose que chaque item peut avoir des suppléments
    if (item.productName.includes('Spaghetti') && !item.isSupplement) {
      supplements.push({
        name: 'Œuf',
        quantity: item.quantity,
        unitPrice: 200,
        totalPrice: 200 * item.quantity,
      });
    }
    
    return supplements;
  };

  const calculateItemTotal = (item: OrderItem): number => {
    const supplements = groupSupplements(item);
    const supplementsTotal = supplements.reduce((sum, sup) => sum + sup.totalPrice, 0);
    return (item.totalPrice || (item.quantity * item.unitPrice)) + supplementsTotal;
  };

  const calculateOrderTotal = (): number => {
    return order.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const renderOrderHeader = () => (
    <Box sx={{ mb: compact ? 2 : 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant={compact ? 'h6' : 'h5'} sx={{ fontWeight: 600, color: designTokens.colors.text.primary }}>
            Commande #{order.id}
          </Typography>
          <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
            {new Date(order.createdAt).toLocaleString('fr-FR')}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <Box
            sx={{
              px: 1.5,
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
              px: 1.5,
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

      {/* Client Info */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
          Client: {order.client?.name || 'Non spécifié'}
        </Typography>
        {order.tableNumber && (
          <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
            Table: {order.tableNumber}
          </Typography>
        )}
      </Box>

      {/* Actions */}
      {showActions && !readOnly && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onEdit && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => onEdit(order)}
              disabled={order.status === 'completed' || order.status === 'cancelled'}
            >
              Modifier
            </Button>
          )}
          
          {onAddItem && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={onAddItem}
              disabled={order.status === 'completed' || order.status === 'cancelled'}
            >
              Ajouter un article
            </Button>
          )}
          
          {onDelete && order.status === 'pending' && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{ color: designTokens.colors.error.main, borderColor: designTokens.colors.error.main }}
            >
              Supprimer
            </Button>
          )}
        </Box>
      )}
    </Box>
  );

  const renderOrderItems = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, color: designTokens.colors.text.primary }}>
        Articles ({order.items.length})
      </Typography>
      
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        {order.items.map((item, index) => {
          const supplements = groupSupplements(item);
          const itemTotal = calculateItemTotal(item);
          const isExpanded = expandedItems.has(item.id || index);
          
          return (
            <motion.div key={item.id || index} variants={staggerItem} custom={index}>
              <Card
                variant={compact ? 'outlined' : 'elevation'}
                elevation={compact ? 0 : 1}
                sx={{
                  mb: 2,
                  transition: designTokens.transitions.normal,
                  '&:hover': !compact ? {
                    transform: 'translateY(-2px)',
                    boxShadow: designTokens.shadows.hover,
                  } : {},
                }}
              >
                <CardContent sx={{ p: compact ? 2 : 3 }}>
                  {/* Item Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant={compact ? 'body2' : 'body1'} sx={{ fontWeight: 600 }}>
                        {item.productName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                        {item.unitPrice.toFixed(0)} FCFA/unité
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {!readOnly && onUpdateQuantity && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityUpdate(item.id || index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            sx={{ color: designTokens.colors.error.main }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          
                          <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityUpdate(item.id || index, item.quantity + 1)}
                            sx={{ color: designTokens.colors.success.main }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                      
                      <Typography variant={compact ? 'body2' : 'h6'} sx={{ color: designTokens.colors.primary.main, fontWeight: 600 }}>
                        {itemTotal.toFixed(0)} FCFA
                      </Typography>
                    </Box>
                  </Box>

                  {/* Quantity Display */}
                  <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary, mb: 1 }}>
                    {item.quantity} × {item.unitPrice.toFixed(0)} FCFA
                    {itemTotal > (item.quantity * item.unitPrice) && (
                      <Typography variant="caption" sx={{ color: designTokens.colors.success.main, ml: 1 }}>
                        (avec suppléments)
                      </Typography>
                    )}
                  </Typography>

                  {/* Supplements */}
                  {supplements.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          mb: 1,
                        }}
                        onClick={() => toggleItemExpansion(item.id || index)}
                      >
                        <Typography variant="caption" sx={{ color: designTokens.colors.info.main, fontWeight: 600 }}>
                          {supplements.length} supplément(s)
                        </Typography>
                        <InfoIcon fontSize="small" sx={{ color: designTokens.colors.info.main }} />
                      </Box>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Box sx={{ pl: 2, borderLeft: '2px solid #E0E0E0' }}>
                              {supplements.map((supplement, supIndex) => (
                                <Box key={supIndex} sx={{ mb: 1 }}>
                                  <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                                    + {supplement.quantity} × {supplement.name} ({supplement.unitPrice.toFixed(0)} FCFA)
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: designTokens.colors.success.main, ml: 1 }}>
                                    = {supplement.totalPrice.toFixed(0)} FCFA
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </Box>
  );

  const renderOrderTotal = () => {
    const orderTotal = calculateOrderTotal();
    const originalTotal = order.totalAmount;
    const hasDifference = Math.abs(orderTotal - originalTotal) > 0.01;

    return (
      <Card sx={{ bgcolor: designTokens.colors.primary.main + '5', border: `1px solid ${designTokens.colors.primary.main}20` }}>
        <CardContent sx={{ p: compact ? 2 : 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: designTokens.colors.text.primary }}>
            Récapitulatif
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
                Sous-total des articles
              </Typography>
              <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
                {order.items.reduce((sum, item) => sum + (item.totalPrice || (item.quantity * item.unitPrice)), 0).toFixed(0)} FCFA
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
                Total des suppléments
              </Typography>
              <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
                {order.items.reduce((sum, item) => {
                  const supplements = groupSupplements(item);
                  return sum + supplements.reduce((supSum, sup) => supSum + sup.totalPrice, 0);
                }, 0).toFixed(0)} FCFA
              </Typography>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: designTokens.colors.text.primary, fontWeight: 700 }}>
                Total de la commande
              </Typography>
              <Typography variant="h5" sx={{ color: designTokens.colors.primary.main, fontWeight: 700 }}>
                {orderTotal.toFixed(0)} FCFA
              </Typography>
            </Box>
            
            {hasDifference && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Le total calculé ({orderTotal.toFixed(0)} FCFA) diffère du total enregistré ({originalTotal.toFixed(0)} FCFA)
                </Typography>
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Alerts */}
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
      
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Header */}
      {renderOrderHeader()}

      {/* Order Items */}
      {renderOrderItems()}

      {/* Order Total */}
      {renderOrderTotal()}
    </Box>
  );
};

export default OrderSummary;
