import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import {
  getUserByPhone,
  getAllUsers,
  getClientOrders,
} from '@shared/api';
import { User } from '@shared/types/user';
import { Order } from '@shared/types/order';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AnimatedCard from '../components/animations/AnimatedCard';
import StatCard from '../components/ui/StatCard';
import SectionTitle from '../components/ui/SectionTitle';
import PageTransition from '../components/ui/PageTransition';
import { designTokens } from '../design-tokens';
import { staggerContainer, staggerItem, slideUp } from '../constants/animations';

const ClientsScreen: React.FC = () => {
  const [clients, setClients] = useState<User[]>([]);
  const [allClients, setAllClients] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    // Filtrer les clients par terme de recherche
    if (!searchTerm.trim()) {
      setClients(allClients);
    } else {
      const filtered = allClients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phoneNumber.includes(searchTerm) ||
          (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setClients(filtered);
    }
  }, [searchTerm, allClients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      const clientUsers = allUsers.filter((u) => u.role === 'client');
      setAllClients(clientUsers);
      setClients(clientUsers);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClientDetails = async (client: User) => {
    setSelectedClient(client);
    setClientDialogOpen(true);
    setActiveTab(0);
    setOrdersLoading(true);
    try {
      const orders = await getClientOrders(client.id);
      setClientOrders(orders);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des commandes');
    } finally {
      setOrdersLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return { bg: '#E8F5E9', color: '#2E7D32', icon: <CheckCircleIcon /> };
      case 'cancelled':
      case 'failed':
        return { bg: '#FFEBEE', color: '#DC143C', icon: <CancelIcon /> };
      case 'pending':
        return { bg: '#FFF3E0', color: '#FF9800', icon: <PendingIcon /> };
      default:
        return { bg: '#F5F5F5', color: '#666666', icon: <PendingIcon /> };
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      completed: 'Terminée',
      paid: 'Payée',
      cancelled: 'Annulée',
      failed: 'Échouée',
      pending: 'En attente',
    };
    return statusMap[status] || status;
  };

  // Calculer les statistiques globales
  const totalClients = clients.length;
  const totalRevenue = clients.reduce((sum, client) => sum + Number(client.totalSpent || 0), 0);
  const averageOrderValue = totalClients > 0 ? totalRevenue / totalClients : 0;
  const totalOrders = clientOrders.length;

  // Calculer les statistiques du client sélectionné
  const selectedClientStats = selectedClient
    ? {
        totalOrders: clientOrders.length,
        totalSpent: clientOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        averageOrderValue:
          clientOrders.length > 0
            ? clientOrders.reduce((sum, order) => sum + order.totalAmount, 0) / clientOrders.length
            : 0,
        lastOrderDate:
          clientOrders.length > 0
            ? new Date(clientOrders[0].createdAt)
            : null,
        completedOrders: clientOrders.filter((o) => o.status === 'completed' || o.status === 'paid').length,
      }
    : null;

  return (
    <PageTransition>
      <Box>
        <SectionTitle
          title="Gestion des Clients"
          subtitle={`${totalClients} ${totalClients === 1 ? 'client enregistré' : 'clients enregistrés'}`}
        />

      {/* Statistiques globales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <StatCard
            title="Total Clients"
            value={totalClients}
            icon={<PersonIcon />}
            color={designTokens.colors.status.info}
            delay={0}
          />
        </Grid>
        <Grid item xs={6}>
          <StatCard
            title="Revenus Totaux"
            value={`${Number(totalRevenue).toFixed(0)} FCFA`}
            icon={<MoneyIcon />}
            color={designTokens.colors.status.success}
            delay={0.1}
          />
        </Grid>
        <Grid item xs={12}>
          <StatCard
            title="Panier Moyen"
            value={`${Number(averageOrderValue).toFixed(0)} FCFA`}
            icon={<TrendingUpIcon />}
            color={designTokens.colors.status.warning}
            delay={0.2}
          />
        </Grid>
      </Grid>

      {/* Barre de recherche */}
      <motion.div variants={slideUp} initial="initial" animate="animate">
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <TextField
            fullWidth
            placeholder="Rechercher par nom, téléphone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#666666' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: '#bd0f3b',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#bd0f3b',
                },
              },
            }}
          />
        </Paper>
      </motion.div>

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

      {/* Liste des clients */}
      {loading && clients.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: '#bd0f3b' }} />
        </Box>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {clients.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                backgroundColor: '#FFFFFF',
              }}
            >
              <PersonIcon sx={{ fontSize: 64, color: '#CCCCCC', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000', mb: 1 }}>
                Aucun client trouvé
              </Typography>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                {searchTerm
                  ? 'Aucun client ne correspond à votre recherche'
                  : 'Commencez par ajouter des clients'}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {clients.map((client, index) => (
                <Grid item xs={12} sm={6} md={4} key={client.id}>
                  <motion.div
                    variants={staggerItem}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: index * 0.05 }}
                  >
                    <AnimatedCard
                      delay={index * 0.05}
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                      onClick={() => handleViewClientDetails(client)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                          <Avatar
                            sx={{
                              width: 56,
                              height: 56,
                              bgcolor: '#bd0f3b',
                              fontSize: '1.5rem',
                              fontWeight: 700,
                            }}
                          >
                            {client.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: '#000000',
                                mb: 0.5,
                                fontSize: '1.125rem',
                              }}
                            >
                              {client.name}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mb: 0.5,
                              }}
                            >
                              <PhoneIcon sx={{ fontSize: 14, color: '#666666' }} />
                              <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.875rem' }}>
                                {client.phoneNumber}
                              </Typography>
                            </Box>
                            {client.email && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <EmailIcon sx={{ fontSize: 14, color: '#666666' }} />
                                <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.875rem' }}>
                                  {client.email}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box>
                            <Typography variant="caption" sx={{ color: '#666666', display: 'block' }}>
                              Total dépensé
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: '#bd0f3b',
                                fontSize: '1.25rem',
                              }}
                            >
                              {Number(client.totalSpent || 0).toFixed(0)} FCFA
                            </Typography>
                          </Box>
                          <Chip
                            label="Voir détails"
                            size="small"
                            sx={{
                              backgroundColor: '#bd0f3b',
                              color: '#FFFFFF',
                              fontWeight: 600,
                              '&:hover': {
                                backgroundColor: '#8B0000',
                              },
                            }}
                          />
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

      {/* Dialog détaillé du client */}
      <Dialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            maxHeight: '90vh',
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        {selectedClient && (
          <>
            <DialogTitle
              sx={{
                fontWeight: 700,
                color: '#000000',
                fontSize: '1.25rem',
                pb: 2,
                borderBottom: '2px solid #F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: '#bd0f3b',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                  }}
                >
                  {selectedClient.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#000000' }}>
                    {selectedClient.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.875rem' }}>
                    Détails du client
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => setClientDialogOpen(false)}
                sx={{
                  color: '#666666',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{
                  mb: 3,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                  },
                }}
              >
                <Tab label="Informations" icon={<PersonIcon />} iconPosition="start" />
                <Tab label="Commandes" icon={<ReceiptIcon />} iconPosition="start" />
                <Tab label="Statistiques" icon={<TrendingUpIcon />} iconPosition="start" />
              </Tabs>

              {activeTab === 0 && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Card sx={{ borderRadius: 2, backgroundColor: '#F5F5F5' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <PhoneIcon sx={{ color: '#bd0f3b', fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                              Téléphone
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ color: '#666666' }}>
                            {selectedClient.phoneNumber}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    {selectedClient.email && (
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ borderRadius: 2, backgroundColor: '#F5F5F5' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                              <EmailIcon sx={{ color: '#bd0f3b', fontSize: 20 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                                Email
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ color: '#666666' }}>
                              {selectedClient.email}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Card sx={{ borderRadius: 2, backgroundColor: '#F5F5F5' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <CalendarIcon sx={{ color: '#bd0f3b', fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                              Date d'inscription
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ color: '#666666' }}>
                            {selectedClient.createdAt
                              ? format(new Date(selectedClient.createdAt), 'dd MMMM yyyy', { locale: fr })
                              : 'Non disponible'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  {ordersLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress sx={{ color: '#bd0f3b' }} />
                    </Box>
                  ) : clientOrders.length === 0 ? (
                    <Paper
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 2,
                        backgroundColor: '#F5F5F5',
                      }}
                    >
                      <ReceiptIcon sx={{ fontSize: 64, color: '#CCCCCC', mb: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000', mb: 1 }}>
                        Aucune commande
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666666' }}>
                        Ce client n'a pas encore passé de commande
                      </Typography>
                    </Paper>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {clientOrders.map((order) => {
                        const statusInfo = getStatusColor(order.status);
                        return (
                          <Card key={order.id} sx={{ borderRadius: 2, border: '1px solid #E0E0E0', backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                  <Typography variant="body2" sx={{ color: '#666666', mb: 0.5 }}>
                                    {format(new Date(order.createdAt), 'dd MMMM yyyy à HH:mm', {
                                      locale: fr,
                                    })}
                                  </Typography>
                                  <Typography
                                    variant="h5"
                                    sx={{
                                      fontWeight: 700,
                                      color: '#000000',
                                      fontSize: '1.5rem',
                                    }}
                                  >
                                    {Number(order.totalAmount).toFixed(0)} FCFA
                                  </Typography>
                                </Box>
                                <Chip
                                  icon={statusInfo.icon}
                                  label={getStatusLabel(order.status)}
                                  sx={{
                                    backgroundColor: statusInfo.bg,
                                    color: statusInfo.color,
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>
                              {order.items && order.items.length > 0 && (
                                <Box>
                                  <Divider sx={{ my: 1.5 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000', mb: 1 }}>
                                    Articles commandés :
                                  </Typography>
                                  <List dense>
                                    {order.items.map((item: any, idx: number) => (
                                      <ListItem key={idx} sx={{ px: 0 }}>
                                        <ListItemIcon>
                                          <ShoppingCartIcon sx={{ fontSize: 18, color: '#666666' }} />
                                        </ListItemIcon>
                                        <ListItemText
                                          primary={item.productName || 'Produit'}
                                          secondary={`${item.quantity} × ${Number(item.unitPrice || 0).toFixed(0)} FCFA`}
                                          primaryTypographyProps={{
                                            sx: { fontWeight: 500, fontSize: '0.9375rem' },
                                          }}
                                          secondaryTypographyProps={{
                                            sx: { fontSize: '0.8125rem' },
                                          }}
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#000000' }}>
                                          {Number(item.totalPrice || 0).toFixed(0)} FCFA
                                        </Typography>
                                      </ListItem>
                                    ))}
                                  </List>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              )}

              {activeTab === 2 && selectedClientStats && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={6}>
                      <Card sx={{ borderRadius: 2, backgroundColor: '#FFFFFF', border: '2px solid #E0E0E0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <ReceiptIcon sx={{ color: '#1976D2', fontSize: 24 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                              Total Commandes
                            </Typography>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976D2' }}>
                            {selectedClientStats.totalOrders}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <Card sx={{ borderRadius: 2, backgroundColor: '#FFFFFF', border: '2px solid #E0E0E0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <MoneyIcon sx={{ color: '#2E7D32', fontSize: 24 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                              Total Dépensé
                            </Typography>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                            {Number(selectedClientStats.totalSpent).toFixed(0)} FCFA
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <Card sx={{ borderRadius: 2, backgroundColor: '#FFFFFF', border: '2px solid #E0E0E0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <TrendingUpIcon sx={{ color: '#F57C00', fontSize: 24 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                              Panier Moyen
                            </Typography>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: '#F57C00' }}>
                            {selectedClientStats.averageOrderValue.toFixed(0)} FCFA
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <Card sx={{ borderRadius: 2, backgroundColor: '#FFFFFF', border: '2px solid #E0E0E0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <CheckCircleIcon sx={{ color: '#7B1FA2', fontSize: 24 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                              Commandes Complétées
                            </Typography>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: '#7B1FA2' }}>
                            {selectedClientStats.completedOrders}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    {selectedClientStats.lastOrderDate && (
                      <Grid item xs={12}>
                        <Card sx={{ borderRadius: 2, backgroundColor: '#F5F5F5' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                              <CalendarIcon sx={{ color: '#666666', fontSize: 20 }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                                Dernière commande
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ color: '#666666' }}>
                              {format(selectedClientStats.lastOrderDate, 'dd MMMM yyyy à HH:mm', {
                                locale: fr,
                              })}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F5F5F5' }}>
              <Button
                onClick={() => setClientDialogOpen(false)}
                sx={{
                  color: '#bd0f3b',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
    </PageTransition>
  );
};

export default ClientsScreen;
