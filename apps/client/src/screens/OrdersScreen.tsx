import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardActions,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  getClientOrders,
  getOrder,
} from '@shared/api/orders';
import { Order } from '@shared/types/order';
import { useAuth } from '../contexts/AuthContext';
import { useRefresh } from '../contexts/RefreshContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { exportOrderToPDF } from '../utils/pdfExport';

const OrdersScreen: React.FC = () => {
  const { user } = useAuth();
  const { registerRefresh, unregisterRefresh } = useRefresh();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  
  // États pour les filtres et la recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const loadOrders = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const clientOrders = await getClientOrders(user.id);
      setOrders(clientOrders);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, loadOrders]);

  useEffect(() => {
    registerRefresh(loadOrders);
    return () => {
      unregisterRefresh();
    };
  }, [registerRefresh, unregisterRefresh, loadOrders]);

  const handleViewOrder = async (orderId: number) => {
    setLoading(true);
    try {
      const order = await getOrder(orderId);
      if (order && order.clientId === user?.id) {
        setSelectedOrder(order);
        setOpenDialog(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = (order?: Order) => {
    const orderToExport = order || selectedOrder;
    if (orderToExport) {
      try {
        exportOrderToPDF(orderToExport);
      } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        setError('Erreur lors de l\'export PDF. Veuillez réessayer.');
      }
    }
  };

  // Calculer le montant total payé pour une commande
  const getPaidAmount = (order: Order): number => {
    if (!order.payments || order.payments.length === 0) {
      return 0;
    }
    return order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  };

  // Calculer le montant restant à payer
  const getRemainingAmount = (order: Order): number => {
    const total = Number(order.totalAmount);
    const paid = getPaidAmount(order);
    return Math.max(0, total - paid);
  };

  const getPaymentStatusLabel = (order: Order): string => {
    const paid = getPaidAmount(order);
    const total = Number(order.totalAmount);
    
    if (paid >= total) {
      return 'Payé';
    } else if (paid > 0) {
      return 'Partiellement payé';
    } else {
      return 'Non payé';
    }
  };

  // Fonction de filtrage des commandes
  const filteredOrders = orders.filter((order) => {
    // Filtre par recherche (montant, date, produits)
    const matchesSearch = searchQuery === '' || 
      Number(order.totalAmount).toFixed(0).includes(searchQuery) ||
      format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }).toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filtre par date
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate >= today;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = orderDate >= monthAgo;
          break;
        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          matchesDate = orderDate >= yearAgo;
          break;
        default:
          matchesDate = true;
      }
    }

    // Filtre par paiement
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesDate && matchesPayment;
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setPaymentFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || dateFilter !== 'all' || paymentFilter !== 'all';

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: '1.375rem', sm: '1.5rem' }, color: '#000000', mb: 0.75, lineHeight: 1.2 }}>
        Mes commandes
      </Typography>
      <Typography variant="body2" sx={{ color: '#666666', mb: 3, fontSize: { xs: '0.8rem', sm: '0.875rem' }, fontWeight: 500, lineHeight: 1.5 }}>
        Historique complet de toutes vos commandes avec preuves de paiement
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: 1.5,
            backgroundColor: '#FFEBEE',
            color: '#DC143C',
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Zone de recherche et filtres */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Stack spacing={2}>
          {/* Barre de recherche */}
          <TextField
            fullWidth
            placeholder="Rechercher par montant, date ou produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#666666' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    sx={{ color: '#666666' }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                backgroundColor: '#FFFFFF',
              },
            }}
          />

          {/* Filtres */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth sx={{ minWidth: 150 }}>
              <InputLabel id="date-filter-label">Date</InputLabel>
              <Select
                labelId="date-filter-label"
                value={dateFilter}
                label="Date"
                onChange={(e) => setDateFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon sx={{ color: '#666666', fontSize: 18, mr: 1 }} />
                  </InputAdornment>
                }
                sx={{
                  borderRadius: 1.5,
                }}
              >
                <MenuItem value="all">Toutes les dates</MenuItem>
                <MenuItem value="today">Aujourd'hui</MenuItem>
                <MenuItem value="week">Cette semaine</MenuItem>
                <MenuItem value="month">Ce mois</MenuItem>
                <MenuItem value="year">Cette année</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ minWidth: 150 }}>
              <InputLabel id="payment-filter-label">Paiement</InputLabel>
              <Select
                labelId="payment-filter-label"
                value={paymentFilter}
                label="Paiement"
                onChange={(e) => setPaymentFilter(e.target.value)}
                sx={{
                  borderRadius: 1.5,
                }}
              >
                <MenuItem value="all">Tous les paiements</MenuItem>
                <MenuItem value="paid">Payé</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
              </Select>
            </FormControl>

            {hasActiveFilters && (
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                sx={{
                  borderRadius: 1.5,
                  borderColor: '#E0E0E0',
                  color: '#666666',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#bd0f3b',
                    color: '#bd0f3b',
                  },
                }}
              >
                Réinitialiser
              </Button>
            )}
          </Stack>

          {/* Compteur de résultats */}
          {hasActiveFilters && (
            <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.875rem' }}>
              {filteredOrders.length} {filteredOrders.length > 1 ? 'commandes trouvées' : 'commande trouvée'} sur {orders.length}
            </Typography>
          )}
        </Stack>
      </Paper>

      {loading && orders.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#bd0f3b' }} />
        </Box>
      ) : orders.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          <ReceiptIcon sx={{ fontSize: 64, color: '#CCCCCC', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#666666', fontWeight: 500 }}>
            Aucune commande
          </Typography>
          <Typography variant="body2" sx={{ color: '#999999', mt: 1 }}>
            Vos commandes apparaîtront ici
          </Typography>
        </Paper>
      ) : filteredOrders.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          <SearchIcon sx={{ fontSize: 64, color: '#CCCCCC', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#666666', fontWeight: 500 }}>
            Aucune commande trouvée
          </Typography>
          <Typography variant="body2" sx={{ color: '#999999', mt: 1 }}>
            Essayez de modifier vos critères de recherche
          </Typography>
          {hasActiveFilters && (
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{
                mt: 2,
                borderRadius: 1.5,
                borderColor: '#E0E0E0',
                color: '#666666',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#bd0f3b',
                  color: '#bd0f3b',
                },
              }}
            >
              Réinitialiser les filtres
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredOrders.map((order) => (
            <Grid item xs={12} sm={6} md={4} key={order.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#666666',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#999999',
                          fontSize: { xs: '0.65rem', sm: '0.7rem' },
                          display: 'block',
                          mt: 0.5,
                          fontWeight: 500,
                        }}
                      >
                        {format(new Date(order.createdAt), 'HH:mm', { locale: fr })}
                      </Typography>
                    </Box>
                    <ReceiptIcon sx={{ fontSize: 24, color: '#bd0f3b', opacity: 0.7 }} />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 900,
                        color: '#000000',
                        fontSize: { xs: '1.375rem', sm: '1.5rem' },
                        mb: 1,
                        lineHeight: 1.1,
                      }}
                    >
                      {Number(order.totalAmount).toFixed(0)} FCFA
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666666',
                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                          fontWeight: 600,
                          mb: 0.5,
                        }}
                      >
                        Payé: {getPaidAmount(order).toFixed(0)} FCFA
                      </Typography>
                      {getRemainingAmount(order) > 0 && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#DC143C',
                            fontSize: { xs: '0.75rem', sm: '0.8rem' },
                            fontWeight: 700,
                          }}
                        >
                          Reste à payer: {getRemainingAmount(order).toFixed(0)} FCFA
                        </Typography>
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666666',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        fontWeight: 600,
                      }}
                    >
                      {order.items.length} {order.items.length > 1 ? 'articles' : 'article'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      label={getPaymentStatusLabel(order)}
                      size="small"
                      sx={{
                        bgcolor:
                          getPaidAmount(order) >= Number(order.totalAmount)
                            ? '#2E7D3220'
                            : getPaidAmount(order) > 0
                            ? '#FF980020'
                            : '#DC143C20',
                        color:
                          getPaidAmount(order) >= Number(order.totalAmount)
                            ? '#1B5E20'
                            : getPaidAmount(order) > 0
                            ? '#E65100'
                            : '#B71C1C',
                        fontWeight: 700,
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        borderRadius: 1.5,
                        height: 26,
                        px: 1,
                        border:
                          getPaidAmount(order) >= Number(order.totalAmount)
                            ? '1px solid #2E7D3240'
                            : getPaidAmount(order) > 0
                            ? '1px solid #FF980040'
                            : '1px solid #DC143C40',
                      }}
                    />
                  </Box>
                </CardContent>

                <CardActions
                  sx={{
                    p: 2,
                    pt: 0,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                  }}
                >
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewOrder(order.id)}
                    sx={{
                      color: '#666666',
                      fontWeight: 700,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      textTransform: 'none',
                      px: 1.5,
                      '&:hover': {
                        color: '#bd0f3b',
                        backgroundColor: 'rgba(189, 15, 59, 0.08)',
                      },
                    }}
                  >
                    Voir
                  </Button>
                  {getPaidAmount(order) >= Number(order.totalAmount) && (
                    <Button
                      size="small"
                      startIcon={<PdfIcon />}
                      onClick={() => handleExportPDF(order)}
                      sx={{
                        color: '#bd0f3b',
                        fontWeight: 700,
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        textTransform: 'none',
                        px: 1.5,
                        '&:hover': {
                          backgroundColor: 'rgba(189, 15, 59, 0.08)',
                        },
                      }}
                    >
                      PDF
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog pour voir les détails d'une commande */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: '#F5F5F5',
            borderBottom: '1px solid #E0E0E0',
            fontWeight: 700,
            fontSize: '1.25rem',
            color: '#000000',
            p: 3,
          }}
        >
          Commande du {selectedOrder && format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedOrder && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000', fontSize: '0.875rem' }}>
                    Statut de paiement:
                  </Typography>
                  <Chip
                    label={getPaymentStatusLabel(selectedOrder)}
                    size="small"
                    sx={{
                      bgcolor:
                        getPaidAmount(selectedOrder) >= Number(selectedOrder.totalAmount)
                          ? '#2E7D3215'
                          : getPaidAmount(selectedOrder) > 0
                          ? '#FF980015'
                          : '#DC143C15',
                      color:
                        getPaidAmount(selectedOrder) >= Number(selectedOrder.totalAmount)
                          ? '#2E7D32'
                          : getPaidAmount(selectedOrder) > 0
                          ? '#FF9800'
                          : '#DC143C',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderRadius: 1.5,
                    }}
                  />
                </Box>
                <Box sx={{ mb: 1.5, p: 2, backgroundColor: '#F5F5F5', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#000000', fontSize: '0.875rem', mb: 1 }}>
                    Montant total: {Number(selectedOrder.totalAmount).toFixed(0)} FCFA
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.875rem', mb: 0.5 }}>
                    Montant payé: {getPaidAmount(selectedOrder).toFixed(0)} FCFA
                  </Typography>
                  {getRemainingAmount(selectedOrder) > 0 && (
                    <Typography variant="body2" sx={{ color: '#DC143C', fontSize: '0.875rem', fontWeight: 700 }}>
                      Reste à payer: {getRemainingAmount(selectedOrder).toFixed(0)} FCFA
                    </Typography>
                  )}
                </Box>
                {selectedOrder.paymentMethod && (
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontSize: '0.875rem', color: '#666666' }}>
                    Méthode de paiement: {selectedOrder.paymentMethod === 'cash' ? 'Espèces' : selectedOrder.paymentMethod === 'wave' ? 'Wave' : 'Autre'}
                  </Typography>
                )}
                <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', color: '#666666' }}>
                  Date: {format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy à HH:mm:ss', { locale: fr })}
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#000000' }}>Produit</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#000000' }}>Quantité</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#000000' }}>Prix unitaire</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#000000' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{Number(item.unitPrice).toFixed(0)} FCFA</TableCell>
                      <TableCell align="right">{Number(item.totalPrice).toFixed(0)} FCFA</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="h6">Total:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6">{Number(selectedOrder.totalAmount).toFixed(0)} FCFA</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              {getPaidAmount(selectedOrder) >= Number(selectedOrder.totalAmount) && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: '#E8F5E9',
                    border: '1px solid #2E7D32',
                    borderRadius: 1.5,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#2E7D32', fontSize: '0.875rem' }}>
                    ✓ Cette commande a été payée le {selectedOrder.completedAt ? format(new Date(selectedOrder.completedAt), 'dd/MM/yyyy à HH:mm', { locale: fr }) : format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}. Cette information sert de preuve de paiement.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: '#F5F5F5', borderTop: '1px solid #E0E0E0' }}>
          {selectedOrder && getPaidAmount(selectedOrder) >= Number(selectedOrder.totalAmount) && (
            <Button
              startIcon={<PdfIcon />}
              onClick={() => handleExportPDF(selectedOrder)}
              sx={{
                backgroundColor: '#bd0f3b',
                color: '#FFFFFF',
                borderRadius: 1.5,
                padding: '12px 24px',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#e01a4f',
                },
              }}
            >
              Exporter en PDF
            </Button>
          )}
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              backgroundColor: 'transparent',
              border: '1px solid #E0E0E0',
              color: '#000000',
              borderRadius: 1.5,
              padding: '12px 24px',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#F5F5F5',
              },
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersScreen;
