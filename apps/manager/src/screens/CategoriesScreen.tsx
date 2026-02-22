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
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Fab,
  FormControlLabel,
  Switch,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { 
  FaBeer, FaWineGlass, FaCocktail, FaCoffee, FaGlassMartini,
  FaPizzaSlice, FaHamburger, FaFish, FaDrumstickBite, FaIceCream,
  FaGamepad, FaTv, FaMusic, FaSwimmingPool, FaBed,
  FaUtensils, FaWineBottle, FaBreadSlice, FaCheese
} from 'react-icons/fa';
import { 
  MdLocalBar, MdRestaurant, MdFastfood, MdDining, MdRoomService,
  MdSportsBar, MdCake, MdIcecream, MdLunchDining, MdDinnerDining
} from 'react-icons/md';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@shared/api/categories';
import { Category, CategoryCreationAttributes, DEFAULT_CATEGORIES } from '@shared/types/category';
import AnimatedCard from '../components/animations/AnimatedCard';
import SectionTitle from '../components/ui/SectionTitle';
import PageTransition from '../components/ui/PageTransition';
import { designTokens } from '../design-tokens';
import { staggerContainer, staggerItem } from '../constants/animations';

// Fonction helper pour obtenir le composant d'icône par nom
const getIconComponent = (iconName: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    FaBeer: <FaBeer />,
    FaWineGlass: <FaWineGlass />,
    FaCocktail: <FaCocktail />,
    FaCoffee: <FaCoffee />,
    FaGlassWater: <FaGlassMartini />,
    FaWineBottle: <FaWineBottle />,
    MdLocalBar: <MdLocalBar />,
    MdSportsBar: <MdSportsBar />,
    FaPizzaSlice: <FaPizzaSlice />,
    FaHamburger: <FaHamburger />,
    FaFish: <FaFish />,
    FaDrumstickBite: <FaDrumstickBite />,
    FaIceCream: <FaIceCream />,
    FaBowlFood: <FaUtensils />,
    FaBreadSlice: <FaBreadSlice />,
    FaCheese: <FaCheese />,
    MdRestaurant: <MdRestaurant />,
    MdFastfood: <MdFastfood />,
    MdDining: <MdDining />,
    MdCake: <MdCake />,
    MdIcecream: <MdIcecream />,
    MdLunchDining: <MdLunchDining />,
    MdDinnerDining: <MdDinnerDining />,
    FaGamepad: <FaGamepad />,
    FaTv: <FaTv />,
    FaMusic: <FaMusic />,
    FaSwimmingPool: <FaSwimmingPool />,
    FaBed: <FaBed />,
    MdRoomService: <MdRoomService />,
  };
  return iconMap[iconName] || null;
};

const CategoriesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryCreationAttributes>({
    name: '',
    description: '',
    icon: '',
    color: '#bd0f3b',
  });
  const [openIconPicker, setOpenIconPicker] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const allCategories = await getCategories();
      setCategories(allCategories);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#bd0f3b',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        icon: '',
        color: '#bd0f3b',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Veuillez remplir le nom de la catégorie');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon || null,
          color: formData.color,
        });
      } else {
        await createCategory(formData);
      }
      await loadCategories();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteCategory(categoryId);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaultCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      for (const defaultCat of DEFAULT_CATEGORIES) {
        try {
          await createCategory(defaultCat);
        } catch (err) {
          // Ignorer si la catégorie existe déjà
        }
      }
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création des catégories par défaut');
    } finally {
      setLoading(false);
    }
  };

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
              title="Catégories"
              subtitle={`${categories.length} catégorie${categories.length > 1 ? 's' : ''} enregistrée${categories.length > 1 ? 's' : ''}`}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          {categories.length === 0 && (
            <Button
              variant="outlined"
              onClick={handleSeedDefaultCategories}
              disabled={loading}
              sx={{
                borderColor: '#bd0f3b',
                color: '#bd0f3b',
                '&:hover': {
                  borderColor: '#8B0000',
                  bgcolor: 'rgba(189, 15, 59, 0.1)',
                },
              }}
            >
              Créer les catégories par défaut
            </Button>
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

      {loading && categories.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: '#bd0f3b' }} />
        </Box>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {categories.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                backgroundColor: '#FFFFFF',
              }}
            >
              <Typography variant="body1" sx={{ color: '#666666', mb: 2 }}>
                Aucune catégorie
              </Typography>
              <Button
                variant="contained"
                onClick={handleSeedDefaultCategories}
                sx={{
                  backgroundColor: '#bd0f3b',
                  '&:hover': { backgroundColor: '#8B0000' },
                }}
              >
                Créer les catégories par défaut
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {categories.map((category, index) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <motion.div
                    variants={staggerItem}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: index * 0.05 }}
                  >
                    <AnimatedCard delay={index * 0.05}>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000', mb: 1 }}>
                              {category.name}
                            </Typography>
                            {category.description && (
                              <Typography variant="body2" sx={{ color: '#666666', mb: 1 }}>
                                {category.description}
                              </Typography>
                            )}
                            <Chip
                              label={category.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              sx={{
                                bgcolor: category.isActive ? '#2E7D32' : '#999999',
                                color: 'white',
                              }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <IconButton
                              onClick={() => handleOpenDialog(category)}
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
                              onClick={() => handleDelete(category.id)}
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
              ))}
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
          {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        </DialogTitle>
        <DialogContent>
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

          {/* Sélection d'icône */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#000000' }}>
              Icône
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                border: '1px solid #E0E0E0',
                borderRadius: 2,
                backgroundColor: '#FAFAFA',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#F5F5F5',
                },
              }}
              onClick={() => setOpenIconPicker(true)}
            >
              {formData.icon ? (
                <Box sx={{ fontSize: 32, color: formData.color }}>
                  {getIconComponent(formData.icon)}
                </Box>
              ) : (
                <ImageIcon sx={{ fontSize: 32, color: '#999999' }} />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  {formData.icon ? 'Icône sélectionnée' : 'Cliquez pour choisir une icône'}
                </Typography>
                {formData.icon && (
                  <Typography variant="caption" sx={{ color: '#999999' }}>
                    {formData.icon}
                  </Typography>
                )}
              </Box>
              <IconButton size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Sélection de couleur */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#000000' }}>
              Couleur
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {[
                '#bd0f3b', '#DC143C', '#4CAF50', '#2196F3', '#FF9800',
                '#9C27B0', '#00BCD4', '#FF5722', '#795548', '#607D8B',
                '#E91E63', '#3F51B5', '#009688', '#FFC107', '#673AB7'
              ].map((color) => (
                <Box
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    backgroundColor: color,
                    cursor: 'pointer',
                    border: formData.color === color ? '3px solid #000000' : '2px solid #E0E0E0',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    },
                  }}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              label="Couleur personnalisée (hex)"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              margin="normal"
              type="color"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {editingCategory && (
            <FormControlLabel
              control={
                <Switch
                  checked={editingCategory.isActive}
                  onChange={async (e) => {
                    if (editingCategory) {
                      await updateCategory(editingCategory.id, { isActive: e.target.checked });
                      await loadCategories();
                    }
                  }}
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
              label="Active"
              sx={{ mt: 2 }}
            />
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

      {/* Dialog de sélection d'icône */}
      <Dialog
        open={openIconPicker}
        onClose={() => setOpenIconPicker(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#000000' }}>
          Choisir une icône
        </DialogTitle>
        <DialogContent>
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            <Grid container spacing={2}>
              {/* Icônes de boissons */}
              {[
                { name: 'FaBeer', component: <FaBeer /> },
                { name: 'FaWineGlass', component: <FaWineGlass /> },
                { name: 'FaCocktail', component: <FaCocktail /> },
                { name: 'FaCoffee', component: <FaCoffee /> },
                { name: 'FaGlassWater', component: <FaGlassMartini /> },
                { name: 'FaWineBottle', component: <FaWineBottle /> },
                { name: 'MdLocalBar', component: <MdLocalBar /> },
                { name: 'MdSportsBar', component: <MdSportsBar /> },
              ].map((icon) => (
                <Grid item xs={3} sm={2} key={icon.name}>
                  <Box
                    onClick={() => {
                      setFormData({ ...formData, icon: icon.name });
                      setOpenIconPicker(false);
                    }}
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: formData.icon === icon.name ? `2px solid ${formData.color}` : '1px solid #E0E0E0',
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: formData.icon === icon.name ? `${formData.color}15` : '#FAFAFA',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: `${formData.color}25`,
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <Box sx={{ fontSize: 32, color: formData.color, mb: 1 }}>
                      {icon.component}
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center' }}>
                      {icon.name}
                    </Typography>
                  </Box>
                </Grid>
              ))}

              {/* Icônes de nourriture */}
              {[
                { name: 'FaPizzaSlice', component: <FaPizzaSlice /> },
                { name: 'FaHamburger', component: <FaHamburger /> },
                { name: 'FaFish', component: <FaFish /> },
                { name: 'FaDrumstickBite', component: <FaDrumstickBite /> },
                { name: 'FaIceCream', component: <FaIceCream /> },
                { name: 'FaBowlFood', component: <FaUtensils /> },
                { name: 'FaBreadSlice', component: <FaBreadSlice /> },
                { name: 'FaCheese', component: <FaCheese /> },
                { name: 'MdRestaurant', component: <MdRestaurant /> },
                { name: 'MdFastfood', component: <MdFastfood /> },
                { name: 'MdDining', component: <MdDining /> },
                { name: 'MdCake', component: <MdCake /> },
                { name: 'MdIcecream', component: <MdIcecream /> },
                { name: 'MdLunchDining', component: <MdLunchDining /> },
                { name: 'MdDinnerDining', component: <MdDinnerDining /> },
              ].map((icon) => (
                <Grid item xs={3} sm={2} key={icon.name}>
                  <Box
                    onClick={() => {
                      setFormData({ ...formData, icon: icon.name });
                      setOpenIconPicker(false);
                    }}
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: formData.icon === icon.name ? `2px solid ${formData.color}` : '1px solid #E0E0E0',
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: formData.icon === icon.name ? `${formData.color}15` : '#FAFAFA',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: `${formData.color}25`,
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <Box sx={{ fontSize: 32, color: formData.color, mb: 1 }}>
                      {icon.component}
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center' }}>
                      {icon.name}
                    </Typography>
                  </Box>
                </Grid>
              ))}

              {/* Icônes de services */}
              {[
                { name: 'FaGamepad', component: <FaGamepad /> },
                { name: 'FaTv', component: <FaTv /> },
                { name: 'FaMusic', component: <FaMusic /> },
                { name: 'FaSwimmingPool', component: <FaSwimmingPool /> },
                { name: 'FaBed', component: <FaBed /> },
                { name: 'MdRoomService', component: <MdRoomService /> },
              ].map((icon) => (
                <Grid item xs={3} sm={2} key={icon.name}>
                  <Box
                    onClick={() => {
                      setFormData({ ...formData, icon: icon.name });
                      setOpenIconPicker(false);
                    }}
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: formData.icon === icon.name ? `2px solid ${formData.color}` : '1px solid #E0E0E0',
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: formData.icon === icon.name ? `${formData.color}15` : '#FAFAFA',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: `${formData.color}25`,
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <Box sx={{ fontSize: 32, color: formData.color, mb: 1 }}>
                      {icon.component}
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center' }}>
                      {icon.name}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenIconPicker(false)} sx={{ color: '#666666', fontWeight: 600 }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </PageTransition>
  );
};

export default CategoriesScreen;
