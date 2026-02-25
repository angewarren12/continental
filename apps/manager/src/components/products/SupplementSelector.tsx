import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Check as CheckIcon } from '@mui/icons-material';
import { getProductSupplements, addProductSupplement } from '@shared/api/product-supplements';
import { getProducts } from '@shared/api/products';
import { Product } from '@shared/types/product';
import { ProductSupplement } from '@shared/types/product-supplement';

interface SupplementSelectorProps {
  productId: number;
  productName: string;
  onSupplementsSelected: (supplements: Product[]) => void;
  onClose: () => void;
  open: boolean;
}

const SupplementSelector: React.FC<SupplementSelectorProps> = ({
  productId,
  productName,
  onSupplementsSelected,
  onClose,
  open,
}) => {
  const [availableSupplements, setAvailableSupplements] = useState<ProductSupplement[]>([]);
  const [allSupplements, setAllSupplements] = useState<Product[]>([]);
  const [selectedSupplements, setSelectedSupplements] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadSupplements();
    }
  }, [open, productId]);

  const loadSupplements = async () => {
    setLoading(true);
    setError(null);
    try {
      // Charger les suppléments déjà associés au produit
      const supplements = await getProductSupplements(productId);
      setAvailableSupplements(supplements);

      // Charger tous les suppléments disponibles
      const allProducts = await getProducts({ isActive: true });
      const supplementsOnly = allProducts.filter(
        (p) => p.productType === 'supplement'
      );
      setAllSupplements(supplementsOnly);

      // Pré-sélectionner les suppléments déjà associés
      setSelectedSupplements(supplements.map((s) => s.supplementId));
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des suppléments');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSupplement = (supplementId: number) => {
    setSelectedSupplements((prev) => {
      if (prev.includes(supplementId)) {
        return prev.filter((id) => id !== supplementId);
      } else {
        return [...prev, supplementId];
      }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ajouter les nouveaux suppléments sélectionnés
      const currentSupplementIds = availableSupplements.map((s) => s.supplementId);
      const toAdd = selectedSupplements.filter((id) => !currentSupplementIds.includes(id));

      for (const supplementId of toAdd) {
        await addProductSupplement(productId, {
          productId,
          supplementId,
          isAvailable: true,
        });
      }

      // Récupérer les produits sélectionnés
      const selectedProducts = allSupplements.filter((s) =>
        selectedSupplements.includes(s.id)
      );

      onSupplementsSelected(selectedProducts);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout des suppléments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon sx={{ color: '#bd0f3b' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Ajouter des suppléments à {productName}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && allSupplements.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : allSupplements.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#666666', textAlign: 'center', py: 4 }}>
            Aucun supplément disponible
          </Typography>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {allSupplements.map((supplement) => {
              const isSelected = selectedSupplements.includes(supplement.id);
              return (
                <Grid item xs={12} sm={6} md={4} key={supplement.id}>
                  <Card
                    sx={{
                      border: isSelected ? '2px solid #bd0f3b' : '1px solid #E0E0E0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => handleToggleSupplement(supplement.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {supplement.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666666' }}>
                            {supplement.price} FCFA
                          </Typography>
                        </Box>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleSupplement(supplement.id)}
                          sx={{
                            color: '#bd0f3b',
                            '&.Mui-checked': {
                              color: '#bd0f3b',
                            },
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: '#666666' }}>
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          sx={{
            backgroundColor: '#bd0f3b',
            '&:hover': { backgroundColor: '#8B0000' },
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplementSelector;
