import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  AttachMoney,
  People,
} from '@mui/icons-material';

interface StatisticsProps {}

const StatisticsScreen: React.FC<StatisticsProps> = () => {
  const [activeTab, setActiveTab] = useState(0);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(amount);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Données factices pour le déploiement
  const stats = {
    totalRevenue: 1500000,
    totalOrders: 245,
    averageOrderValue: 6122,
    growthRate: 15.5,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Statistiques
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Vue d'ensemble" />
          <Tab label="Commandes" />
          <Tab label="Catégories" />
          <Tab label="Paiements" />
          <Tab label="Résumé" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney sx={{ mr: 1, color: '#4CAF50' }} />
                  <Typography variant="h6" color="textSecondary">
                    Revenu Total
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {formatCurrency(stats.totalRevenue)}
                </Typography>
                <Typography variant="body2" color="success.main">
                  +{stats.growthRate}% vs période précédente
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ShoppingCart sx={{ mr: 1, color: '#2196F3' }} />
                  <Typography variant="h6" color="textSecondary">
                    Commandes Totales
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.totalOrders}
                </Typography>
                <Typography variant="body2" color="success.main">
                  +12.3% vs période précédente
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 1, color: '#FF9800' }} />
                  <Typography variant="h6" color="textSecondary">
                    Panier Moyen
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {formatCurrency(stats.averageOrderValue)}
                </Typography>
                <Typography variant="body2" color="success.main">
                  +5.2% vs période précédente
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People sx={{ mr: 1, color: '#9C27B0' }} />
                  <Typography variant="h6" color="textSecondary">
                    Clients Actifs
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  186
                </Typography>
                <Typography variant="body2" color="success.main">
                  +8.7% vs période précédente
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Analyse des Commandes
            </Typography>
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              Les graphiques détaillés des commandes seront bientôt disponibles.
            </Typography>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Répartition par Catégorie
            </Typography>
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              Les graphiques par catégorie seront bientôt disponibles.
            </Typography>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Méthodes de Paiement
            </Typography>
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              Les graphiques de paiement seront bientôt disponibles.
            </Typography>
          </CardContent>
        </Card>
      )}

      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Résumé Détaillé
            </Typography>
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              Le résumé détaillé sera bientôt disponible.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default StatisticsScreen;
