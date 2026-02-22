import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Fab,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  LocalBar as DrinkIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@shared/api/products';
import { getCategories } from '@shared/api/categories';
import { Product, ProductCategory, ProductType, ProductCreateInput } from '@shared/types/product';
import { Category } from '@shared/types/category';
import AnimatedCard from '../components/animations/AnimatedCard';
import SectionTitle from '../components/ui/SectionTitle';
import PageTransition from '../components/ui/PageTransition';
import { designTokens } from '../design-tokens';
import ProductImageUpload from '../components/products/ProductImageUpload';
import CategorySelector from '../components/products/CategorySelector';
import { staggerContainer, staggerItem } from '../constants/animations';

const ProductsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<ProductCategory>('drink');
  const [formData, setFormData] = useState<ProductCreateInput>({
    name: '',
    category: 'drink',
    categoryId: undefined,
    type: 'beer',
    imageUrl: undefined,
    description: '',
    price: 0,
    hasStock: false,
    stockQuantity: 0,
    unit: '',
  });

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategoryFilter, selectedMainCategory]);

  const loadCategories = async () => {
    try {
      const allCategories = await getCategories();
      setCategories(allCategories);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const filters: any = { category: selectedMainCategory };
      if (selectedCategoryFilter) {
        filters.categoryId = selectedCategoryFilter;
      }
      const allProducts = await getProducts(filters);
      setProducts(allProducts);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        categoryId: product.categoryId || undefined,
        type: product.type,
        imageUrl: product.imageUrl || undefined,
        description: product.description || '',
        price: product.price,
        hasStock: product.hasStock,
        stockQuantity: product.stockQuantity || 0,
        unit: product.unit || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: selectedMainCategory,
        categoryId: selectedCategoryFilter || undefined,
        type: selectedMainCategory === 'drink' ? 'beer' : selectedMainCategory === 'food' ? 'spaghetti' : 'billiard_table', // Valeur par défaut basée sur la catégorie
        imageUrl: undefined,
        description: '',
        price: 0,
        hasStock: false,
        stockQuantity: 0,
        unit: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Veuillez remplir le nom du produit');
      return;
    }
    if (formData.price <= 0) {
      setError('Le prix doit être supérieur à 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingProduct) {
        // Lors de la modification, ne pas modifier le stock (géré depuis la vue stock)
        await updateProduct(editingProduct.id, {
          name: formData.name,
          categoryId: formData.categoryId || null,
          imageUrl: formData.imageUrl || null,
          description: formData.description || null,
          price: formData.price,
          isActive: true,
        });
      } else {
        await createProduct(formData);
      }
      await loadProducts();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const productTypes: Record<ProductCategory, ProductType[]> = {
    food: ['spaghetti', 'roasted_chicken'],
    drink: ['beer', 'wine'],
    service: ['billiard_table', 'room_500'],
  };

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    // Les images sont servies directement depuis le serveur, pas via /api
    const BASE_URL = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:3002';
    // S'assurer que imageUrl commence par /
    const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${BASE_URL}${cleanImageUrl}`;
  };

  const drinkCategories = categories.filter((cat) => cat.isActive);

  return (
    <PageTransition>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton
            onClick={() => navigate('/stock')}
            sx={{
              backgroundColor: designTokens.colors.background.paper,
              color: designTokens.colors.text.primary,
              boxShadow: designTokens.shadows.card,
              '&:hover': {
                backgroundColor: designTokens.colors.background.default,
                transform: 'translateX(-2px)',
              },
              transition: designTokens.transitions.normal,
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <SectionTitle 
              title="Produits"
              subtitle={`${products.length} produit${products.length > 1 ? 's' : ''} enregistré${products.length > 1 ? 's' : ''}`}
            />
          </Box>
        </Box>

      {/* Filtres */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={selectedMainCategory}
          onChange={(_, newValue) => setSelectedMainCategory(newValue)}
          sx={{
            mb: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
            '& .Mui-selected': {
              color: '#bd0f3b',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#bd0f3b',
            },
          }}
        >
          <Tab label="Boissons" value="drink" icon={<DrinkIcon />} iconPosition="start" />
          <Tab label="Plats" value="food" icon={<RestaurantIcon />} iconPosition="start" />
          <Tab label="Services" value="service" />
        </Tabs>

        {selectedMainCategory === 'drink' && drinkCategories.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label="Toutes"
              onClick={() => setSelectedCategoryFilter(null)}
              sx={{
                bgcolor: selectedCategoryFilter === null ? '#bd0f3b' : 'grey.300',
                color: selectedCategoryFilter === null ? 'white' : 'black',
                cursor: 'pointer',
              }}
            />
            {drinkCategories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                onClick={() => setSelectedCategoryFilter(category.id)}
                sx={{
                  bgcolor: selectedCategoryFilter === category.id ? category.color : 'grey.300',
                  color: selectedCategoryFilter === category.id ? 'white' : 'black',
                  cursor: 'pointer',
                }}
              />
            ))}
          </Box>
        )}
      </Box>

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

      {loading && products.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: '#bd0f3b' }} />
        </Box>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {products.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                backgroundColor: '#FFFFFF',
              }}
            >
              <Typography variant="body1" sx={{ color: '#666666' }}>
                Aucun produit
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {products.map((product, index) => {
                const imageUrl = getImageUrl(product.imageUrl);
                const category = product.categoryDetail || categories.find((c) => c.id === product.categoryId);
                return (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <motion.div
                      variants={staggerItem}
                      initial="initial"
                      animate="animate"
                      transition={{ delay: index * 0.05 }}
                    >
                      <AnimatedCard delay={index * 0.05}>
                        {imageUrl ? (
                          <Box sx={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                            <CardMedia
                              component="img"
                              image={imageUrl}
                              alt={product.name}
                              sx={{ 
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e: any) => {
                                // Si l'image ne charge pas, masquer l'élément
                                e.target.style.display = 'none';
                              }}
                            />
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
                            {selectedMainCategory === 'drink' ? (
                              <DrinkIcon sx={{ fontSize: 64, color: '#CCCCCC' }} />
                            ) : (
                              <RestaurantIcon sx={{ fontSize: 64, color: '#CCCCCC' }} />
                            )}
                          </Box>
                        )}
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {category && (
                                  <Chip
                                    label={category.name}
                                    size="small"
                                    sx={{
                                      bgcolor: category.color,
                                      color: 'white',
                                      fontWeight: 600,
                                    }}
                                  />
                                )}
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
                                  {product.name}
                                </Typography>
                              </Box>
                              {product.description && (
                                <Typography variant="body2" sx={{ color: '#666666', mb: 1 }}>
                                  {product.description}
                                </Typography>
                              )}
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 700, color: '#bd0f3b', mb: 0.5 }}
                              >
                                {product.price.toFixed(0)} FCFA
                              </Typography>
                              {product.hasStock && (
                                <Typography variant="body2" sx={{ color: '#666666' }}>
                                  Stock: {product.stockQuantity || 0} {product.unit || ''}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <IconButton
                                onClick={() => handleOpenDialog(product)}
                                sx={{
                                  color: '#bd0f3b',
                                  '&:hover': {
                                    backgroundColor: 'rgba(189, 15, 59, 0.1)',
                                  },
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDelete(product.id)}
                                sx={{
                                  color: '#bd0f3b',
                                  '&:hover': {
                                    backgroundColor: 'rgba(189, 15, 59, 0.1)',
                                  },
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </AnimatedCard>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </motion.div>
      )}

      {/* FAB */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenDialog()}
        sx={{
          position: 'fixed',
          bottom: { xs: 80, sm: 24 },
          right: 24,
          backgroundColor: '#bd0f3b',
          '&:hover': {
            backgroundColor: '#8B0000',
          },
        }}
      >
        <AddIcon />
      </Fab>

      {/* Dialog */}
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
        <DialogTitle sx={{ fontWeight: 700, color: '#000000' }}>
          {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
        </DialogTitle>
        <DialogContent>
          <ProductImageUpload
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url || undefined })}
          />
          <TextField
            fullWidth
            label="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          {formData.category === 'drink' && drinkCategories.length > 0 && (
            <CategorySelector
              categories={drinkCategories}
              value={formData.categoryId || null}
              onChange={(categoryId) => setFormData({ ...formData, categoryId: categoryId || undefined })}
              label="Catégorie de boisson"
            />
          )}
          <TextField
            fullWidth
            label="Prix (FCFA)"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
            }
            margin="normal"
            required
            inputProps={{ min: 0, step: 0.01 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          {!editingProduct && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasStock}
                    onChange={(e) => setFormData({ ...formData, hasStock: e.target.checked })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#bd0f3b',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#bd0f3b',
                      },
                    }}
                  />
                }
                label="Gérer le stock"
                sx={{ mt: 2 }}
              />
              {formData.hasStock && (
                <>
                  <TextField
                    fullWidth
                    label="Quantité en stock"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: parseInt(e.target.value) || 0,
                      })
                    }
                    margin="normal"
                    inputProps={{ min: 0 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Unité (ex: bouteille, verre)"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    margin="normal"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: '#666666',
              fontWeight: 600,
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#bd0f3b',
              color: '#FFFFFF',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#8B0000',
              },
              '&:disabled': {
                backgroundColor: '#CCCCCC',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </PageTransition>
  );
};

export default ProductsScreen;
