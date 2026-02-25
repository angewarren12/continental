import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  ShoppingCart as CartIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, OrderItem } from '@shared/types/order';
import { User } from '@shared/types/user';
import { Product } from '@shared/types/product';
import { Category } from '@shared/types/category';
import PageTransition from '../ui/PageTransition';
import { staggerContainer, staggerItem } from '../../constants/animations';
import { orderApiService, OrderSupplement } from '../../services/OrderApiService';

interface OrderBuilderProps {
  order?: Order | null;
  onSave: (orderData: any) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

type BuilderStep = 'products' | 'client' | 'payment' | 'review';

const OrderBuilder: React.FC<OrderBuilderProps> = ({
  order,
  onSave,
  onCancel,
  readOnly = false,
}) => {
  const [currentStep, setCurrentStep] = useState<BuilderStep>('products');
  const [selectedProducts, setSelectedProducts] = useState<OrderItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSupplements, setSelectedSupplements] = useState<OrderSupplement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');

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
    },
    transitions: {
      normal: 'all 0.2s ease-in-out',
    },
  };

  const steps = [
    { label: 'Produits', step: 'products' as BuilderStep },
    { label: 'Client', step: 'client' as BuilderStep },
    { label: 'Paiement', step: 'payment' as BuilderStep },
    { label: 'Révision', step: 'review' as BuilderStep },
  ];

  useEffect(() => {
    if (order) {
      // Charger les données de la commande existante
      setSelectedProducts(order.items || []);
      setSelectedClient(order.client as any || null);
      setTableNumber(order.tableNumber || '');
      setTotalAmount(order.totalAmount);
    }
  }, [order]);

  useEffect(() => {
    // Calculer le montant total
    const total = selectedProducts.reduce((sum, item) => sum + (item.totalPrice || (item.quantity * item.unitPrice)), 0);
    setTotalAmount(total);
  }, [selectedProducts]);

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

  const handleAddProduct = (product: Product) => {
    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price,
      isSupplement: false,
    };
    
    setSelectedProducts([...selectedProducts, newItem]);
    setError(null);
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedProducts = [...selectedProducts];
    updatedProducts[index].quantity = newQuantity;
    updatedProducts[index].totalPrice = newQuantity * updatedProducts[index].unitPrice;
    
    setSelectedProducts(updatedProducts);
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(updatedProducts);
  };

  const handleClientSelect = (client: User | null) => {
    setSelectedClient(client);
    setClientSearchTerm('');
  };

  const handleNextStep = () => {
    const stepIndex = steps.findIndex(step => step.step === currentStep);
    
    // Validation avant de passer à l'étape suivante
    if (currentStep === 'products' && selectedProducts.length === 0) {
      setError('Veuillez ajouter au moins un produit');
      return;
    }
    
    if (currentStep === 'client' && !selectedClient) {
      setError('Veuillez sélectionner un client');
      return;
    }
    
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].step);
      setError(null);
    }
  };

  const handlePreviousStep = () => {
    const stepIndex = steps.findIndex(step => step.step === currentStep);
    
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].step);
      setError(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validation finale
      if (!selectedClient) {
        setError('Veuillez sélectionner un client');
        return;
      }

      if (selectedProducts.length === 0) {
        setError('Veuillez ajouter au moins un produit');
        return;
      }

      const orderData = {
        clientId: selectedClient.id,
        items: selectedProducts,
        supplements: selectedSupplements,
        tableNumber: tableNumber || undefined,
        notes: orderNotes,
        totalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        method: 'cash', // Méthode de paiement par défaut
      };

      let result;

      if (order) {
        // Mise à jour de commande existante
        const updateData = {
          id: order.id,
          ...orderData,
        };
        
        const response = await orderApiService.updateOrder(order.id, updateData);
        
        if (!response.success) {
          throw new Error(response.error || 'Erreur lors de la mise à jour de la commande');
        }

        result = response.data;
        setSuccess(response.message || 'Commande mise à jour avec succès');

        // Mettre à jour les suppléments si nécessaire
        if (selectedSupplements.length > 0) {
          // Supprimer les anciens suppléments et ajouter les nouveaux
          for (const item of selectedProducts) {
            const itemSupplements = selectedSupplements.filter(sup => sup.order_item_id === item.id);
            if (itemSupplements.length > 0) {
              await orderApiService.addOrderSupplements(order.id, item.id || 0, itemSupplements);
            }
          }
        }
      } else {
        // Création d'une nouvelle commande
        const response = await orderApiService.createOrder(orderData);
        
        if (!response.success) {
          throw new Error(response.error || 'Erreur lors de la création de la commande');
        }

        result = response.data;
        setSuccess(response.message || 'Commande créée avec succès');

        // Ajouter les suppléments après la création de la commande
        if (selectedSupplements.length > 0 && result && result.id) {
          for (const item of selectedProducts) {
            const itemSupplements = selectedSupplements.filter(sup => sup.order_item_id === item.id);
            if (itemSupplements.length > 0) {
              await orderApiService.addOrderSupplements(result.id, item.id || 0, itemSupplements);
            }
          }
        }
      }

      console.log(order ? 'Commande mise à jour:' : 'Commande créée:', result);

      // Appeler le callback de succès
      onSave(result);
      
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.message || 'Erreur lors de la sauvegarde de la commande');
    } finally {
      setLoading(false);
    }
  };

  const renderProductsStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: designTokens.colors.text.primary }}>
        Sélection des produits
      </Typography>
      
      {/* Product Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher un produit..."
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

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: designTokens.colors.text.secondary }}>
            Produits sélectionnés ({selectedProducts.length})
          </Typography>
          
          <Grid container spacing={2}>
            {selectedProducts.map((item, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.productName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                          {item.unitPrice.toFixed(0)} FCFA
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                          disabled={readOnly}
                          sx={{ color: designTokens.colors.error.main }}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        
                        <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          disabled={readOnly}
                          sx={{ color: designTokens.colors.success.main }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                        
                        {!readOnly && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveProduct(index)}
                            sx={{ color: designTokens.colors.error.main }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="h6" sx={{ mt: 1, color: designTokens.colors.primary.main }}>
                      {(item.totalPrice || (item.quantity * item.unitPrice)).toFixed(0)} FCFA
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Products Grid */}
      <Typography variant="subtitle2" sx={{ mb: 2, color: designTokens.colors.text.secondary }}>
        Produits disponibles
      </Typography>
      
      <Grid container spacing={2}>
        {products
          .filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.categoryId && product.categoryId.toString().includes(searchTerm.toLowerCase()))
          )
          .map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card
                sx={{
                  cursor: readOnly ? 'default' : 'pointer',
                  transition: designTokens.transitions.normal,
                  '&:hover': !readOnly ? {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  } : {},
                }}
                onClick={() => !readOnly && handleAddProduct(product)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    {product.name}
                  </Typography>
                  <Typography variant="h6" sx={{ color: designTokens.colors.primary.main }}>
                    {product.price.toFixed(0)} FCFA
                  </Typography>
                  {product.categoryId && (
                    <Chip
                      label={`Catégorie ${product.categoryId}`}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </motion.div>
  );

  const renderClientStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: designTokens.colors.text.primary }}>
        Sélection du client
      </Typography>
      
      {/* Client Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher un client..."
          value={clientSearchTerm}
          onChange={(e) => setClientSearchTerm(e.target.value)}
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

      {/* Selected Client */}
      {selectedClient && (
        <Card sx={{ mb: 3, bgcolor: designTokens.colors.success.main + '10' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ color: designTokens.colors.success.main }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedClient.name}
                </Typography>
                <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                  {selectedClient.phoneNumber}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Clients List */}
      <Typography variant="subtitle2" sx={{ mb: 2, color: designTokens.colors.text.secondary }}>
        Clients disponibles
      </Typography>
      
      <Grid container spacing={2}>
        {clients
          .filter(client => 
            client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
            client.phoneNumber.includes(clientSearchTerm)
          )
          .map((client) => (
            <Grid item xs={12} sm={6} key={client.id}>
              <Card
                sx={{
                  cursor: readOnly ? 'default' : 'pointer',
                  transition: designTokens.transitions.normal,
                  '&:hover': !readOnly ? {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  } : {},
                }}
                onClick={() => !readOnly && handleClientSelect(client)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon sx={{ color: designTokens.colors.text.secondary }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {client.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                        {client.phoneNumber}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </motion.div>
  );

  const renderPaymentStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: designTokens.colors.text.primary }}>
        Informations complémentaires
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Numéro de table"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            disabled={readOnly}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Notes de commande"
            multiline
            rows={4}
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            disabled={readOnly}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Order Summary */}
      <Card sx={{ mt: 3, bgcolor: designTokens.colors.primary.main + '5' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: designTokens.colors.text.primary }}>
            Récapitulatif de la commande
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
              Client: {selectedClient?.name || 'Non sélectionné'}
            </Typography>
            {tableNumber && (
              <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
                Table: {tableNumber}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
              Nombre d'articles: {selectedProducts.length}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h5" sx={{ color: designTokens.colors.primary.main, fontWeight: 700 }}>
            Total: {totalAmount.toFixed(0)} FCFA
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderReviewStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Typography variant="h6" sx={{ mb: 3, color: designTokens.colors.text.primary }}>
        Révision finale
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: designTokens.colors.text.primary }}>
            Détails de la commande
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
              Client: {selectedClient?.name || 'Non sélectionné'}
            </Typography>
            {tableNumber && (
              <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
                Table: {tableNumber}
              </Typography>
            )}
            {orderNotes && (
              <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
                Notes: {orderNotes}
              </Typography>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" sx={{ mb: 2, color: designTokens.colors.text.secondary }}>
            Articles ({selectedProducts.length})
          </Typography>
          
          {selectedProducts.map((item, index) => (
            <Box key={index} sx={{ mb: 1, pl: 2 }}>
              <Typography variant="body2">
                {item.quantity} × {item.productName} = {(item.totalPrice || (item.quantity * item.unitPrice)).toFixed(0)} FCFA
              </Typography>
            </Box>
          ))}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h5" sx={{ color: designTokens.colors.primary.main, fontWeight: 700 }}>
            Total: {totalAmount.toFixed(0)} FCFA
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'products':
        return renderProductsStep();
      case 'client':
        return renderClientStep();
      case 'payment':
        return renderPaymentStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  const currentStepIndex = steps.findIndex(step => step.step === currentStep);

  return (
    <PageTransition>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ color: designTokens.colors.text.primary, fontWeight: 600 }}>
            {order ? 'Modifier la commande' : 'Nouvelle commande'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {currentStep > 0 && (
              <Button
                variant="outlined"
                onClick={handlePreviousStep}
                disabled={loading}
              >
                Précédent
              </Button>
            )}
            
            {currentStep < steps.length - 1 && (
              <Button
                variant="contained"
                onClick={handleNextStep}
                disabled={loading}
              >
                Suivant
              </Button>
            )}
            
            {currentStep === steps.length - 1 && (
              <Button
                variant="contained"
                onClick={handleCreateOrder}
                disabled={loading || !selectedClient || selectedProducts.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                sx={{
                  bgcolor: designTokens.colors.success.main,
                  '&:hover': { bgcolor: '#388E3C' },
                }}
              >
                {loading ? 'Sauvegarde...' : 'Confirmer la commande'}
              </Button>
            )}
          </Box>
        </Box>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Alert */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stepper */}
        <Stepper activeStep={currentStepIndex} sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.step}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1 }}
        >
          {renderStepContent()}
        </motion.div>
      </Box>
    </PageTransition>
  );
};

export default OrderBuilder;
