import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  People,
  Receipt,
  DateRange,
  Refresh,
  Download,
  Assessment,
  LocalDining,
  Fastfood,
  SmokingRooms,
  Liquor,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les statistiques
interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
  customers: number;
  averageOrderValue: number;
}

interface ProductStats {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  category: string;
}

interface CategoryStats {
  categoryName: string;
  totalRevenue: number;
  orderCount: number;
  percentage: number;
  color: string;
}

interface PaymentStats {
  method: 'cash' | 'wave';
  amount: number;
  count: number;
  percentage: number;
}

const StatisticsScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7days'); // 7days, 30days, 90days, custom
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // États pour les différentes statistiques
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [productStats, setProductStats] = useState<ProductStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats[]>([]);
  
  // Statistiques globales
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [growthRate, setGrowthRate] = useState({ revenue: 0, orders: 0 });

  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const CATEGORY_COLORS = {
    'Plats': '#FF6B6B',
    'Boissons': '#4ECDC4',
    'Cigarettes': '#45B7D1',
    'Suppléments': '#96CEB4',
    'Autres': '#FEA47F',
  };

  // Charger les statistiques
  const loadStatistics = async () => {
    setLoading(true);
    try {
      // Calculer les dates
      const now = new Date();
      let start: Date;
      let end: Date = endOfDay(now);

      switch (timeRange) {
        case '7days':
          start = startOfDay(subDays(now, -7));
          break;
        case '30days':
          start = startOfDay(subDays(now, -30));
          break;
        case '90days':
          start = startOfDay(subDays(now, -90));
          break;
        case 'custom':
          if (startDate && endDate) {
            start = startOfDay(startDate);
            end = endOfDay(endDate);
          } else {
            start = startOfDay(subDays(now, -7));
          }
          break;
        default:
          start = startOfDay(subDays(now, -7));
      }

      // Simuler des données statistiques (remplacer par de vrais appels API)
      const mockDailyStats: DailyStats[] = [];
      const mockProductStats: ProductStats[] = [];
      const mockCategoryStats: CategoryStats[] = [];
      const mockPaymentStats: PaymentStats[] = [];

      // Générer des données quotidiennes
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, -i);
        const baseOrders = Math.floor(Math.random() * 20) + 10;
        const baseRevenue = baseOrders * (Math.floor(Math.random() * 3000) + 2000);
        
        mockDailyStats.push({
          date: format(date, 'dd/MM'),
          orders: baseOrders,
          revenue: baseRevenue,
          customers: Math.floor(baseOrders * 0.8),
          averageOrderValue: Math.floor(baseRevenue / baseOrders),
        });
      }

      // Générer des statistiques de produits
      const products = [
        { name: 'Spaghetti', category: 'Plats', price: 2500 },
        { name: 'Riz Poulet', category: 'Plats', price: 3000 },
        { name: 'Coca Cola', category: 'Boissons', price: 500 },
        { name: 'Marlboro', category: 'Cigarettes', price: 600 },
        { name: 'Œuf', category: 'Suppléments', price: 200 },
      ];

      products.forEach((product, index) => {
        const quantity = Math.floor(Math.random() * 50) + 10;
        const revenue = quantity * product.price;
        const orders = Math.floor(Math.random() * 30) + 5;
        
        mockProductStats.push({
          productId: index + 1,
          productName: product.name,
          totalQuantity: quantity,
          totalRevenue: revenue,
          orderCount: orders,
          category: product.category,
        });
      });

      // Générer des statistiques par catégorie
      const categories = ['Plats', 'Boissons', 'Cigarettes', 'Suppléments'];
      let totalCategoryRevenue = 0;
      
      categories.forEach((category, index) => {
        const revenue = Math.floor(Math.random() * 500000) + 100000;
        const orders = Math.floor(Math.random() * 100) + 20;
        totalCategoryRevenue += revenue;
        
        mockCategoryStats.push({
          categoryName: category,
          totalRevenue: revenue,
          orderCount: orders,
          percentage: 0, // Calculé après
          color: Object.values(CATEGORY_COLORS)[index],
        });
      });

      // Calculer les pourcentages
      mockCategoryStats.forEach(cat => {
        cat.percentage = totalCategoryRevenue > 0 ? (cat.totalRevenue / totalCategoryRevenue) * 100 : 0;
      });

      // Générer des statistiques de paiement
      const cashRevenue = Math.floor(Math.random() * 800000) + 400000;
      const waveRevenue = Math.floor(Math.random() * 300000) + 100000;
      const totalPaymentRevenue = cashRevenue + waveRevenue;

      mockPaymentStats.push(
        {
          method: 'cash',
          amount: cashRevenue,
          count: Math.floor(Math.random() * 150) + 50,
          percentage: (cashRevenue / totalPaymentRevenue) * 100,
        },
        {
          method: 'wave',
          amount: waveRevenue,
          count: Math.floor(Math.random() * 80) + 20,
          percentage: (waveRevenue / totalPaymentRevenue) * 100,
        }
      );

      // Calculer les totaux
      const totalRev = mockDailyStats.reduce((sum, day) => sum + day.revenue, 0);
      const totalOrd = mockDailyStats.reduce((sum, day) => sum + day.orders, 0);
      const totalCust = mockDailyStats.reduce((sum, day) => sum + day.customers, 0);
      const avgOrdVal = totalOrd > 0 ? Math.floor(totalRev / totalOrd) : 0;

      setTotalRevenue(totalRev);
      setTotalOrders(totalOrd);
      setTotalCustomers(totalCust);
      setAverageOrderValue(avgOrdVal);

      // Calculer les taux de croissance (simulation)
      setGrowthRate({
        revenue: Math.floor(Math.random() * 20) - 10,
        orders: Math.floor(Math.random() * 15) - 5,
      });

      setDailyStats(mockDailyStats);
      setProductStats(mockProductStats);
      setCategoryStats(mockCategoryStats);
      setPaymentStats(mockPaymentStats);

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [timeRange, startDate, endDate]);

  const handleExportData = () => {
    // Logique d'exportation des données
    const data = {
      period: timeRange,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        growthRate,
      },
      dailyStats,
      productStats,
      categoryStats,
      paymentStats,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistiques-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'Plats':
        return <LocalDining />;
      case 'Boissons':
        return <Liquor />;
      case 'Cigarettes':
        return <SmokingRooms />;
      case 'Suppléments':
        return <Fastfood />;
      default:
        return <ShoppingCart />;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F5F5F5', minHeight: '100vh' }}>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937' }}>
          📊 Tableau de Bord Statistiques
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Période</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7days">7 derniers jours</MenuItem>
              <MenuItem value="30days">30 derniers jours</MenuItem>
              <MenuItem value="90days">90 derniers jours</MenuItem>
              <MenuItem value="custom">Personnalisé</MenuItem>
            </Select>
          </FormControl>

          {timeRange === 'custom' && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <input
                type="date"
                value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <span>à</span>
              <input
                type="date"
                value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </Box>
          )}

          <Tooltip title="Actualiser">
            <IconButton onClick={loadStatistics} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>

          <Tooltip title="Exporter les données">
            <IconButton onClick={handleExportData} color="primary">
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Cartes de statistiques globales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Chiffre d'Affaires
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatCurrency(totalRevenue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {growthRate.revenue >= 0 ? (
                  <TrendingUp sx={{ color: '#4CAF50', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: '#F44336', mr: 0.5 }} />
                )}
                <Typography variant="body2">
                  {growthRate.revenue >= 0 ? '+' : ''}{growthRate.revenue}% vs période précédente
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCart sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Commandes Totales
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totalOrders.toLocaleString('fr-FR')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {growthRate.orders >= 0 ? (
                  <TrendingUp sx={{ color: '#4CAF50', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: '#F44336', mr: 0.5 }} />
                )}
                <Typography variant="body2">
                  {growthRate.orders >= 0 ? '+' : ''}{growthRate.orders}% vs période précédente
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Clients Uniques
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {totalCustomers.toLocaleString('fr-FR')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Assessment sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  Moyenne: {Math.floor(totalCustomers / (timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90))}/jour
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Receipt sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Panier Moyen
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatCurrency(averageOrderValue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <DateRange sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  Sur la période sélectionnée
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Onglets pour les différents graphiques */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue as number)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            '& .MuiTab-root': { 
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem'
            }
          }}
        >
          <Tab label="📈 Évolution" />
          <Tab label="🍕 Produits" />
          <Tab label="📂 Catégories" />
          <Tab label="💳 Paiements" />
          <Tab label="📋 Détails" />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Évolution du Chiffre d'Affaires
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${name}: ${formatCurrency(value as number)}`,
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Évolution des Commandes
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${name}: ${value}`,
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Produits les Plus Vendus
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={productStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${name}: ${formatCurrency(value as number)}`,
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="totalRevenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Top 10 des Produits
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Produit</TableCell>
                        <TableCell align="right">Quantité</TableCell>
                        <TableCell align="right">Revenu</TableCell>
                        <TableCell align="right">Commandes</TableCell>
                        <TableCell>Catégorie</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productStats.slice(0, 10).map((product) => (
                        <TableRow key={product.productId}>
                          <TableCell component="th" scope="row">
                            {product.productName}
                          </TableCell>
                          <TableCell align="right">
                            {product.totalQuantity.toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(product.totalRevenue)}
                          </TableCell>
                          <TableCell align="right">
                            {product.orderCount}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={product.category}
                              size="small"
                              sx={{
                                backgroundColor: CATEGORY_COLORS[product.category as keyof typeof CATEGORY_COLORS] || '#gray',
                                color: 'white',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Répartition par Catégorie
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ categoryName, percentage }) => `${categoryName}: ${percentage.toFixed(1)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="totalRevenue"
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Détails par Catégorie
                </Typography>
                {categoryStats.map((category) => (
                  <Box
                    key={category.categoryName}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      backgroundColor: '#F8F9FA',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 2, color: category.color }}>
                        {getCategoryIcon(category.categoryName)}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {category.categoryName}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: category.color }}>
                        {formatCurrency(category.totalRevenue)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {category.orderCount} commandes ({category.percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Répartition des Paiements
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ method, percentage }) => `${method === 'cash' ? 'Espèces' : 'Wave'}: ${percentage.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {paymentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4CAF50' : '#2196F3'} />
                      ))}
                    </Pie>
                  </PieChart>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Méthodes de Paiement
                </Typography>
                {paymentStats.map((payment) => (
                  <Box
                    key={payment.method}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      backgroundColor: payment.method === 'cash' ? '#E8F5E8' : '#E3F2FD',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {payment.method === 'cash' ? '💵 Espèces' : '📱 Wave'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatCurrency(payment.amount)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {payment.count} transactions ({payment.percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Résumé Détaillé
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, backgroundColor: '#F8F9FA', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Performance Période
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Revenu total:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatCurrency(totalRevenue)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Commandes totales:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {totalOrders.toLocaleString('fr-FR')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Panier moyen:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatCurrency(averageOrderValue)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, backgroundColor: '#F8F9FA', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Taux de Croissance
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Croissance revenus:</Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700,
                          color: growthRate.revenue >= 0 ? '#4CAF50' : '#F44336'
                        }}
                      >
                        {growthRate.revenue >= 0 ? '+' : ''}{growthRate.revenue}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Croissance commandes:</Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700,
                          color: growthRate.orders >= 0 ? '#4CAF50' : '#F44336'
                        }}
                      >
                        {growthRate.orders >= 0 ? '+' : ''}{growthRate.orders}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Box>
  );
};

export default StatisticsScreen;
