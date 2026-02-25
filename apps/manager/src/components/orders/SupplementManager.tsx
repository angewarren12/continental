import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  RestaurantMenu as SupplementIcon,
  AttachMoney as PriceIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@shared/types/product';
import { OrderItem } from '@shared/types/order';
import { staggerContainer, staggerItem } from '../../constants/animations';

interface SupplementItem {
  id: number;
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  parentItemIndex?: number;
}

interface SupplementManagerProps {
  availableSupplements: Product[];
  selectedSupplements: SupplementItem[];
  onSupplementAdd?: (supplement: SupplementItem) => void;
  onSupplementRemove?: (supplementId: number) => void;
  onSupplementUpdate?: (supplementId: number, newQuantity: number) => void;
  onSupplementEdit?: (supplement: SupplementItem) => void;
  readOnly?: boolean;
  showPrices?: boolean;
  compact?: boolean;
  maxQuantity?: number;
}

const SupplementManager: React.FC<SupplementManagerProps> = ({
  availableSupplements,
  selectedSupplements,
  onSupplementAdd,
  onSupplementRemove,
  onSupplementUpdate,
  onSupplementEdit,
  readOnly = false,
  showPrices = true,
  compact = false,
  maxQuantity = 99,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<SupplementItem | null>(null);
  const [newQuantity, setNewQuantity] = useState(1);
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

  const filteredSupplements = availableSupplements.filter(supplement =>
    supplement.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    supplement.productType === 'supplement'
  );

  const calculateTotalPrice = () => {
    return selectedSupplements.reduce((total, supplement) => total + supplement.totalPrice, 0);
  };

  const handleAddSupplement = (product: Product) => {
    if (readOnly) return;

    // Vérifier si le supplément est déjà sélectionné
    const existingSupplement = selectedSupplements.find(s => s.productId === product.id);
    
    if (existingSupplement) {
      // Incrémenter la quantité si déjà sélectionné
      handleUpdateQuantity(existingSupplement.id, existingSupplement.quantity + 1);
    } else {
      // Ajouter un nouveau supplément
      const newSupplement: SupplementItem = {
        id: Date.now(), // Temporaire
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: 1,
        totalPrice: product.price,
      };

      if (onSupplementAdd) {
        onSupplementAdd(newSupplement);
        setSuccess(`${product.name} ajouté aux suppléments`);
      }
    }
  };

  const handleRemoveSupplement = (supplementId: number) => {
    if (readOnly) return;

    if (onSupplementRemove) {
      onSupplementRemove(supplementId);
      setSuccess('Supplément retiré');
    }
  };

  const handleUpdateQuantity = (supplementId: number, newQuantity: number) => {
    if (readOnly) return;

    if (newQuantity < 1 || newQuantity > maxQuantity) {
      setError(`La quantité doit être entre 1 et ${maxQuantity}`);
      return;
    }

    if (onSupplementUpdate) {
      onSupplementUpdate(supplementId, newQuantity);
    }
  };

  const handleEditSupplement = (supplement: SupplementItem) => {
    if (readOnly) return;

    setEditingSupplement(supplement);
    setNewQuantity(supplement.quantity);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingSupplement) return;

    if (newQuantity < 1 || newQuantity > maxQuantity) {
      setError(`La quantité doit être entre 1 et ${maxQuantity}`);
      return;
    }

    if (onSupplementEdit) {
      const updatedSupplement = {
        ...editingSupplement,
        quantity: newQuantity,
        totalPrice: newQuantity * editingSupplement.unitPrice,
      };
      
      onSupplementEdit(updatedSupplement);
      setSuccess('Supplément mis à jour');
    }

    setEditDialogOpen(false);
    setEditingSupplement(null);
    setNewQuantity(1);
  };

  const renderSelectedSupplements = () => {
    if (selectedSupplements.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <SupplementIcon sx={{ fontSize: 48, color: designTokens.colors.text.secondary, mb: 2 }} />
          <Typography variant="h6" sx={{ color: designTokens.colors.text.secondary, mb: 1 }}>
            Aucun supplément sélectionné
          </Typography>
          <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
            Ajoutez des suppléments depuis la liste ci-dessous
          </Typography>
        </Box>
      );
    }

    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: designTokens.colors.text.primary }}>
          Suppléments sélectionnés ({selectedSupplements.length})
        </Typography>
        
        <Grid container spacing={2}>
          {selectedSupplements.map((supplement, index) => (
            <Grid item xs={12} sm={6} key={supplement.id}>
              <motion.div variants={staggerItem} custom={index}>
                <Card
                  variant="outlined"
                  sx={{
                    transition: designTokens.transitions.normal,
                    '&:hover': !readOnly ? {
                      transform: 'translateY(-2px)',
                      boxShadow: designTokens.shadows.hover,
                    } : {},
                  }}
                >
                  <CardContent sx={{ p: compact ? 2 : 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {supplement.name}
                        </Typography>
                        {showPrices && (
                          <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                            {supplement.unitPrice.toFixed(0)} FCFA/unité
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!readOnly && (
                          <IconButton
                            size="small"
                            onClick={() => handleEditSupplement(supplement)}
                            sx={{ color: designTokens.colors.info.main }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        
                        {!readOnly && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveSupplement(supplement.id)}
                            sx={{ color: designTokens.colors.error.main }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    {/* Quantity Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {!readOnly ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(supplement.id, supplement.quantity - 1)}
                            disabled={supplement.quantity <= 1}
                            sx={{ color: designTokens.colors.error.main }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          
                          <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                            {supplement.quantity}
                          </Typography>
                          
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(supplement.id, supplement.quantity + 1)}
                            disabled={supplement.quantity >= maxQuantity}
                            sx={{ color: designTokens.colors.success.main }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
                          Quantité: {supplement.quantity}
                        </Typography>
                      )}
                      
                      {showPrices && (
                        <Typography variant="h6" sx={{ color: designTokens.colors.primary.main, fontWeight: 600 }}>
                          {supplement.totalPrice.toFixed(0)} FCFA
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    );
  };

  const renderAvailableSupplements = () => {
    if (filteredSupplements.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <SearchIcon sx={{ fontSize: 48, color: designTokens.colors.text.secondary, mb: 2 }} />
          <Typography variant="h6" sx={{ color: designTokens.colors.text.secondary, mb: 1 }}>
            Aucun supplément disponible
          </Typography>
          <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
            {searchTerm ? 'Essayez une autre recherche' : 'Aucun supplément configuré'}
          </Typography>
        </Box>
      );
    }

    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: designTokens.colors.text.primary }}>
          Suppléments disponibles ({filteredSupplements.length})
        </Typography>
        
        <Grid container spacing={2}>
          {filteredSupplements.map((product, index) => {
            const isSelected = selectedSupplements.some(s => s.productId === product.id);
            const selectedQuantity = selectedSupplements.find(s => s.productId === product.id)?.quantity || 0;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <motion.div variants={staggerItem} custom={index}>
                  <Card
                    sx={{
                      cursor: readOnly ? 'default' : 'pointer',
                      transition: designTokens.transitions.normal,
                      border: isSelected ? `2px solid ${designTokens.colors.primary.main}` : '1px solid #E0E0E0',
                      '&:hover': !readOnly ? {
                        transform: 'translateY(-2px)',
                        boxShadow: designTokens.shadows.hover,
                      } : {},
                    }}
                    onClick={() => !readOnly && handleAddSupplement(product)}
                  >
                    <CardContent sx={{ p: compact ? 2 : 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {product.name}
                          </Typography>
                          {showPrices && (
                            <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                              {product.price.toFixed(0)} FCFA
                            </Typography>
                          )}
                        </Box>
                        
                        {isSelected && (
                          <Chip
                            label={`${selectedQuantity}`}
                            size="small"
                            sx={{
                              bgcolor: designTokens.colors.primary.main,
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Box>
                      
                      {showPrices && (
                        <Typography variant="h6" sx={{ color: designTokens.colors.primary.main }}>
                          {product.price.toFixed(0)} FCFA
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label="Supplément"
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </motion.div>
    );
  };

  const renderEditDialog = () => (
    <Dialog
      open={editDialogOpen}
      onClose={() => setEditDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Modifier le supplément: {editingSupplement?.name}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Quantité</InputLabel>
            <Select
              value={newQuantity}
              onChange={(e) => setNewQuantity(parseInt(e.target.value))}
              label="Quantité"
            >
              {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((qty) => (
                <MenuItem key={qty} value={qty}>
                  {qty} × {editingSupplement?.unitPrice.toFixed(0)} FCFA = {(qty * (editingSupplement?.unitPrice || 0)).toFixed(0)} FCFA
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={() => setEditDialogOpen(false)}>
          Annuler
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSaveEdit}
          sx={{
            bgcolor: designTokens.colors.primary.main,
            '&:hover': { bgcolor: designTokens.colors.primary.dark },
          }}
        >
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );

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

      {/* Search Bar */}
      {!readOnly && (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher un supplément..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: designTokens.colors.text.secondary, mr: 1 }} />
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Box>
      )}

      {/* Selected Supplements */}
      {renderSelectedSupplements()}

      {/* Total */}
      {showPrices && selectedSupplements.length > 0 && (
        <Card sx={{ mt: 3, bgcolor: designTokens.colors.primary.main + '5' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: designTokens.colors.text.primary }}>
                Total des suppléments
              </Typography>
              <Typography variant="h5" sx={{ color: designTokens.colors.primary.main, fontWeight: 700 }}>
                {calculateTotalPrice().toFixed(0)} FCFA
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Available Supplements */}
      {!readOnly && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          {renderAvailableSupplements()}
        </Box>
      )}

      {/* Edit Dialog */}
      {renderEditDialog()}
    </Box>
  );
};

export default SupplementManager;
