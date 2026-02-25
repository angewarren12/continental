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
import { updateStock } from '@shared/api/stock';
import { Product, ProductCategory, ProductType, ProductCreateInput } from '@shared/types/product';
import { Category } from '@shared/types/category';
import AnimatedCard from '../components/animations/AnimatedCard';
import SectionTitle from '../components/ui/SectionTitle';
import PageTransition from '../components/ui/PageTransition';
import { designTokens } from '../design-tokens';
import ProductImageUpload from '../components/products/ProductImageUpload';
import CategorySelector from '../components/products/CategorySelector';
import SupplementSelector from '../components/products/SupplementSelector';
import DishSupplementsManager from '../components/products/DishSupplementsManager';
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
  const [openSupplementDialog, setOpenSupplementDialog] = useState(false);
  const [selectedProductForSupplements, setSelectedProductForSupplements] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductCreateInput>({
    name: '',
    categoryId: undefined,
    productType: undefined,
    imageUrl: undefined,
    description: '',
    price: 0,
    stockUnit: undefined,
    saleUnit: undefined,
    conversionFactor: undefined,
    supplements: [],
  });
  const [hasSupplements, setHasSupplements] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategoryFilter, selectedMainCategory]);

  const loadCategories = async () => {
    try {
      // Charger les catégories filtrées selon la catégorie principale sélectionnée
      const allCategories = await getCategories(selectedMainCategory);
      setCategories(allCategories);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [selectedMainCategory]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedCategoryFilter) {
        filters.categoryId = selectedCategoryFilter;
      }
      const allProducts = await getProducts(filters);
      
      // Filtrer selon l'onglet sélectionné et la catégorie principale
      let filteredProducts = allProducts;
      if (selectedMainCategory === 'food') {
        // Pour l'onglet Plats, afficher tous les produits de type dish
        filteredProducts = allProducts.filter(p => p.productType === 'dish');
      } else if (selectedMainCategory === 'drink') {
        // Pour l'onglet Boissons, afficher les boissons, cigarettes et œufs
        filteredProducts = allProducts.filter(p => 
          p.productType === 'drink' || 
          p.productType === 'cigarette' || 
          p.productType === 'egg'
        );
      } else if (selectedMainCategory === 'service') {
        // Pour l'onglet Services, afficher tous les services
        filteredProducts = allProducts.filter(p => p.productType === 'service');
      }
      
      setProducts(filteredProducts);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      console.log('EDITING PRODUCT:', product);
      console.log('PRODUCT SUPPLEMENTS:', product.supplements);
      setEditingProduct(product);
      const supplements = product.supplements || [];
      console.log('PARSED SUPPLEMENTS:', supplements);
      setHasSupplements(supplements.length > 0);
      setFormData({
        name: product.name,
        categoryId: product.categoryId || undefined,
        productType: product.productType,
        imageUrl: product.imageUrl || undefined,
        description: product.description || '',
        price: product.price,
        stockUnit: product.stockUnit,
        saleUnit: product.saleUnit,
        conversionFactor: product.conversionFactor,
        supplements: supplements,
      });
    } else {
      setEditingProduct(null);
      setHasSupplements(false);
      // Déterminer le productType par défaut selon la catégorie
      let defaultProductType: ProductType | undefined;
      if (selectedMainCategory === 'food') {
        defaultProductType = 'dish';
      } else if (selectedMainCategory === 'drink') {
        defaultProductType = 'drink';
      } else if (selectedMainCategory === 'service') {
        defaultProductType = 'service';
      }
      
      setFormData({
        name: '',
        categoryId: selectedCategoryFilter || undefined,
        productType: defaultProductType,
        imageUrl: undefined,
        description: '',
        price: 0,
        stockUnit: undefined,
        saleUnit: undefined,
        conversionFactor: undefined,
        supplements: [],
      });
    }
    setOpenDialog(true);
  };

  const handleOpenSupplementDialog = (product: Product) => {
    setSelectedProductForSupplements(product);
    setOpenSupplementDialog(true);
  };

  const handleSupplementsSelected = () => {
    // Recharger les produits pour voir les changements
    loadProducts();
    setOpenSupplementDialog(false);
    setSelectedProductForSupplements(null);
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
      // Déterminer automatiquement le productType selon la catégorie principale
      const productType: ProductType = 
        selectedMainCategory === 'food' ? 'dish' : 
        selectedMainCategory === 'drink' ? 'drink' : 
        'service';

      if (editingProduct) {
        // Lors de la modification, inclure productType et suppléments
        const updateData: any = {
          name: formData.name,
          categoryId: formData.categoryId || undefined,
          imageUrl: formData.imageUrl || undefined,
          description: formData.description || undefined,
          price: formData.price,
          productType: productType,
          isActive: true,
        };
        
        // Ajouter les suppléments si c'est un plat
        if (formData.productType === 'dish' && hasSupplements && formData.supplements && formData.supplements.length > 0) {
          updateData.supplements = formData.supplements;
        } else if (formData.productType === 'dish') {
          // Si hasSupplements est false ou si supplements est vide, supprimer tous les suppléments
          updateData.supplements = [];
        }
        
        console.log('[UPDATE PRODUCT] Update data with supplements:', JSON.stringify(updateData, null, 2));
        await updateProduct(editingProduct.id, updateData);
      } else {
        // Pour la création, inclure productType et suppléments
        const productData: ProductCreateInput = {
          name: formData.name,
          categoryId: formData.categoryId || undefined,
          imageUrl: formData.imageUrl || undefined,
          description: formData.description || undefined,
          price: formData.price,
          productType: productType,
        };
        
        // Gérer les suppléments : les envoyer seulement si productType est dish et il y a des suppléments
        if (productType === 'dish' && formData.supplements && formData.supplements.length > 0) {
          productData.supplements = formData.supplements;
        } else {
          productData.supplements = [];
        }
        
        console.log('[CREATE PRODUCT] Product data with supplements:', JSON.stringify(productData, null, 2));
        const createdProduct = await createProduct(productData);
        
        // Créer automatiquement un stock à 0 pour les produits qui nécessitent un stock
        // (tout sauf les produits de type dish)
        if (productType !== 'dish' && createdProduct && createdProduct.id) {
          try {
            await updateStock(createdProduct.id, {
              productId: createdProduct.id,
              quantity: 0,
              type: 'adjustment'
            });
          } catch (stockError) {
            console.warn('Erreur lors de la création du stock:', stockError);
          }
        }
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
    food: ['dish'],
    drink: ['drink'],
    service: ['service'],
  };

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    // Les images sont servies directement depuis le serveur, pas via /api
    // @ts-ignore - Vite injects import.meta.env at build time
    const BASE_URL = (import.meta as any)?.env?.VITE_API_URL 
      ? (import.meta as any).env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:3002';
    // S'assurer que imageUrl commence par /
    const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${BASE_URL}${cleanImageUrl}`;
  };

  // Filtrer les catégories selon la catégorie principale sélectionnée
  const filteredCategories = categories.filter((cat) => 
    cat.isActive && (!cat.mainCategory || cat.mainCategory === selectedMainCategory)
  );

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
          onChange={(_, newValue) => {
            setSelectedMainCategory(newValue);
            setSelectedCategoryFilter(null); // Réinitialiser le filtre de catégorie lors du changement d'onglet
          }}
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

        {filteredCategories.length > 0 && (
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
            {filteredCategories.map((category) => (
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
                                  Stock disponible
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {product.productType === 'dish' && (
                                <IconButton
                                  onClick={() => handleOpenSupplementDialog(product)}
                                  sx={{
                                    color: '#9C27B0',
                                    '&:hover': {
                                      backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                    },
                                  }}
                                  title="Gérer les suppléments"
                                >
                                  <AddIcon />
                                </IconButton>
                              )}
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
          {/* Catégorie (sous-catégorie) - affichée pour toutes les catégories principales */}
          {filteredCategories.length > 0 && (
            <CategorySelector
              categories={filteredCategories}
              value={formData.categoryId || null}
              onChange={(categoryId) => setFormData({ ...formData, categoryId: categoryId || undefined })}
              label={
                selectedMainCategory === 'food' ? 'Catégorie de plat' :
                selectedMainCategory === 'drink' ? 'Catégorie de boisson' :
                'Catégorie de service'
              }
            />
          )}
          
          {/* Description - uniquement pour les services */}
          {formData.productType === 'service' && (
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
          {/* Pour les plats : case "Ce plat peut avoir des suppléments" */}
          {formData.productType === 'dish' && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={hasSupplements}
                    onChange={(e) => {
                      setHasSupplements(e.target.checked);
                      if (!e.target.checked) {
                        setFormData({ ...formData, supplements: [] });
                      }
                    }}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#9C27B0',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#9C27B0',
                      },
                    }}
                  />
                }
                label="Ce plat peut avoir des suppléments"
              />
              {selectedMainCategory === 'food' && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid red', backgroundColor: '#fff9c4' }}>
                  <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                    DEBUG: Catégorie FOOD détectée - Le composant devrait s'afficher
                  </Typography>
                  <DishSupplementsManager
                    supplements={formData.supplements || []}
                    onChange={(supplements) => {
                      console.log('Supplements changed:', supplements);
                      setFormData({ ...formData, supplements });
                      // Activer hasSupplements automatiquement si des suppléments sont ajoutés
                      if (supplements.length > 0) {
                        setHasSupplements(true);
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
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

      {/* Dialog pour gérer les suppléments */}
      {selectedProductForSupplements && (
        <SupplementSelector
          productId={selectedProductForSupplements.id}
          productName={selectedProductForSupplements.name}
          onSupplementsSelected={handleSupplementsSelected}
          onClose={() => {
            setOpenSupplementDialog(false);
            setSelectedProductForSupplements(null);
          }}
          open={openSupplementDialog}
        />
      )}
      </Box>
    </PageTransition>
  );
};

export default ProductsScreen;
