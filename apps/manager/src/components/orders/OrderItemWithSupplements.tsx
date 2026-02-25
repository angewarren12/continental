import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderItem } from '@shared/types/order';

interface SupplementItem {
  id: number;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  parentItemId: number;
}

interface OrderItemWithSupplementsProps {
  item: OrderItem;
  supplements: SupplementItem[];
  onUpdateQuantity?: (itemId: number, newQuantity: number, updateSupplements?: boolean) => void;
  onRemoveItem?: (itemId: number) => void;
  onUpdateSupplement?: (supplementId: number, newQuantity: number) => void;
  onRemoveSupplement?: (supplementId: number) => void;
  readOnly?: boolean;
  compact?: boolean;
}

const OrderItemWithSupplements: React.FC<OrderItemWithSupplementsProps> = ({
  item,
  supplements,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateSupplement,
  onRemoveSupplement,
  readOnly = false,
  compact = false,
}) => {
  const [syncSupplements, setSyncSupplements] = useState(true);
  const [showSupplements, setShowSupplements] = useState(false);
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

  const calculateItemTotal = (): number => {
    const itemTotal = item.totalPrice || (item.quantity * item.unitPrice);
    const supplementsTotal = supplements.reduce((sum, sup) => sum + sup.totalPrice, 0);
    return itemTotal + supplementsTotal;
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      setError('La quantité doit être supérieure à 0');
      return;
    }

    try {
      // Si la synchronisation est activée, mettre à jour les suppléments aussi
      if (onUpdateQuantity) {
        await onUpdateQuantity(item.id || 0, newQuantity, syncSupplements);
        setSuccess('Quantité mise à jour avec succès');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de la quantité');
    }
  };

  const handleSupplementQuantityChange = async (supplementId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      setError('La quantité du supplément doit être supérieure à 0');
      return;
    }

    try {
      if (onUpdateSupplement) {
        await onUpdateSupplement(supplementId, newQuantity);
        setSuccess('Supplément mis à jour avec succès');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du supplément');
    }
  };

  const handleRemoveSupplement = async (supplementId: number) => {
    try {
      if (onRemoveSupplement) {
        await onRemoveSupplement(supplementId);
        setSuccess('Supplément retiré avec succès');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du retrait du supplément');
    }
  };

  const handleRemoveItem = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${item.productName}" ?`)) {
      return;
    }

    try {
      if (onRemoveItem) {
        await onRemoveItem(item.id || 0);
        setSuccess('Article retiré avec succès');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du retrait de l\'article');
    }
  };

  return (
    <Card
      variant={compact ? 'outlined' : 'elevation'}
      elevation={compact ? 0 : 1}
      sx={{
        mb: 2,
        transition: designTokens.transitions.normal,
        '&:hover': !compact ? {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        } : {},
      }}
    >
      <CardContent sx={{ p: compact ? 2 : 3 }}>
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

        {/* Item Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant={compact ? 'body2' : 'body1'} sx={{ fontWeight: 600 }}>
              {item.productName}
            </Typography>
            <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
              {item.unitPrice.toFixed(0)} FCFA/unité
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!readOnly && (
              <IconButton
                size="small"
                onClick={handleRemoveItem}
                sx={{ color: designTokens.colors.error.main }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
            
            <Typography variant={compact ? 'body2' : 'h6'} sx={{ color: designTokens.colors.primary.main, fontWeight: 600 }}>
              {calculateItemTotal().toFixed(0)} FCFA
            </Typography>
          </Box>
        </Box>

        {/* Quantity Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          {!readOnly ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleQuantityChange(item.quantity - 1)}
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
                onClick={() => handleQuantityChange(item.quantity + 1)}
                sx={{ color: designTokens.colors.success.main }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
              Quantité: {item.quantity}
            </Typography>
          )}
          
          <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
            {item.quantity} × {item.unitPrice.toFixed(0)} FCFA
          </Typography>
        </Box>

        {/* Sync Supplements Toggle */}
        {!readOnly && supplements.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={syncSupplements}
                  onChange={(e) => setSyncSupplements(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption">
                    Synchroniser les suppléments
                  </Typography>
                  <SyncIcon fontSize="small" sx={{ color: designTokens.colors.info.main }} />
                </Box>
              }
            />
          </Box>
        )}

        {/* Supplements Section */}
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
              onClick={() => setShowSupplements(!showSupplements)}
            >
              <Typography variant="caption" sx={{ color: designTokens.colors.info.main, fontWeight: 600 }}>
                {supplements.length} supplément(s)
              </Typography>
              <InfoIcon fontSize="small" sx={{ color: designTokens.colors.info.main }} />
              {syncSupplements && (
                <Typography variant="caption" sx={{ color: designTokens.colors.success.main }}>
                  (synchronisé)
                </Typography>
              )}
            </Box>
            
            <AnimatePresence>
              {showSupplements && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ pl: 2, borderLeft: '2px solid #E0E0E0' }}>
                    {supplements.map((supplement, index) => (
                      <Box key={supplement.id} sx={{ mb: 2, pb: 2, borderBottom: index < supplements.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary, fontWeight: 600 }}>
                            {supplement.name}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {!readOnly && !syncSupplements && (
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveSupplement(supplement.id)}
                                sx={{ color: designTokens.colors.error.main }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                            
                            <Typography variant="caption" sx={{ color: designTokens.colors.success.main }}>
                              {supplement.totalPrice.toFixed(0)} FCFA
                            </Typography>
                          </Box>
                        </Box>
                        
                        {!readOnly && !syncSupplements ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleSupplementQuantityChange(supplement.id, supplement.quantity - 1)}
                              disabled={supplement.quantity <= 1}
                              sx={{ color: designTokens.colors.error.main }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            
                            <Typography variant="caption" sx={{ minWidth: 25, textAlign: 'center' }}>
                              {supplement.quantity}
                            </Typography>
                            
                            <IconButton
                              size="small"
                              onClick={() => handleSupplementQuantityChange(supplement.id, supplement.quantity + 1)}
                              sx={{ color: designTokens.colors.success.main }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                            
                            <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                              × {supplement.unitPrice.toFixed(0)} FCFA
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                            {supplement.quantity} × {supplement.unitPrice.toFixed(0)} FCFA
                            {syncSupplements && (
                              <Typography variant="caption" sx={{ color: designTokens.colors.info.main, ml: 1 }}>
                                (auto)
                              </Typography>
                            )}
                          </Typography>
                        )}
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
  );
};

export default OrderItemWithSupplements;
