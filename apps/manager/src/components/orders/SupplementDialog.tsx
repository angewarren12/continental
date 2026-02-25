import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  TextField,
  IconButton,
  Chip,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { Product, ProductSupplement } from '@shared/types/product';

interface SupplementDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product;
  onConfirm: (quantity: number, selectedSupplements: ProductSupplement[]) => void;
}

const SupplementDialog: React.FC<SupplementDialogProps> = ({
  open,
  onClose,
  product,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSupplements, setSelectedSupplements] = useState<ProductSupplement[]>([]);

  const handleSupplementToggle = (supplement: ProductSupplement) => {
    const exists = selectedSupplements.some(s => s.id === supplement.id);
    if (exists) {
      setSelectedSupplements(selectedSupplements.filter(s => s.id !== supplement.id));
    } else {
      setSelectedSupplements([...selectedSupplements, supplement]);
    }
  };

  const calculateTotalPrice = () => {
    const productTotal = product.price * quantity;
    // Multiplier les suppléments par la quantité du plat
    const supplementsTotal = selectedSupplements.reduce((sum, sup) => sum + (sup.supplement_price || 0), 0) * quantity;
    return productTotal + supplementsTotal;
  };

  const handleConfirm = () => {
    onConfirm(quantity, selectedSupplements);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: '#DC143C', fontWeight: 600 }}>
            Personnaliser votre {product.name}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#666' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Quantité du plat principal */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, color: '#000', fontWeight: 600 }}>
            Quantité de {product.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              sx={{ 
                bgcolor: '#DC143C', 
                color: 'white',
                '&:hover': { bgcolor: '#8B0000' }
              }}
            >
              <RemoveIcon />
            </IconButton>
            
            <TextField
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              type="number"
              inputProps={{ min: 1 }}
              sx={{ 
                width: 80, 
                textAlign: 'center',
                '& .MuiOutlinedInput-input': { textAlign: 'center' }
              }}
            />
            
            <IconButton
              onClick={() => setQuantity(quantity + 1)}
              sx={{ 
                bgcolor: '#DC143C', 
                color: 'white',
                '&:hover': { bgcolor: '#8B0000' }
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Suppléments disponibles */}
        {product.supplements && product.supplements.length > 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, color: '#000', fontWeight: 600 }}>
              Suppléments disponibles
            </Typography>
            <Grid container spacing={2}>
              {product.supplements.map((supplement) => (
                <Grid item xs={12} sm={6} key={supplement.id}>
                  <Box
                    sx={{
                      border: selectedSupplements.some(s => s.id === supplement.id) ? '2px solid #DC143C' : '1px solid #ddd',
                      borderRadius: 2,
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#DC143C',
                        bgcolor: '#FFF5F5',
                      },
                    }}
                    onClick={() => handleSupplementToggle(supplement)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {supplement.supplement_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#DC143C', fontWeight: 600 }}>
                        {supplement.supplement_price} FCFA
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#F8F9FA' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Typography variant="h6" sx={{ color: '#DC143C', fontWeight: 600 }}>
            Total: {calculateTotalPrice()} FCFA
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={onClose} sx={{ color: '#666' }}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              sx={{
                bgcolor: '#DC143C',
                color: 'white',
                '&:hover': { bgcolor: '#8B0000' },
              }}
            >
              Ajouter à la commande
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default SupplementDialog;
