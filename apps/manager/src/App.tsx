import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from './hooks/useAuthState';
import { AuthContextProvider } from './contexts/AuthContext';
import { useCapacitor } from './hooks/useCapacitor';
import { isAuthenticated } from '@shared/api/auth';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ClientsScreen from './screens/ClientsScreen';
import ProductsScreen from './screens/ProductsScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import StockScreen from './screens/StockScreen';
import OrdersScreen from './screens/OrdersScreen';
import CreateOrderScreen from './screens/CreateOrderScreen';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

function App() {
  return (
    <AuthContextProvider>
      <AppRoutes />
    </AuthContextProvider>
  );
}

function CapacitorInit() {
  useCapacitor();
  return null;
}

function AppRoutes() {
  const { user, loading } = useAuthState();

  // Pendant le chargement, vérifier si un token existe
  // Si oui, attendre la vérification avant de rediriger
  if (loading) {
    // Si un token existe, attendre la vérification (l'utilisateur sera probablement connecté)
    if (isAuthenticated()) {
      return <LoadingScreen />;
    }
    // Sinon, pas de token, aller au splash
    return (
      <>
        <CapacitorInit />
        <Routes>
          <Route path="/*" element={<SplashScreen />} />
        </Routes>
      </>
    );
  }

  // Après le chargement, si l'utilisateur est connecté, le laisser accéder aux routes protégées
  // Sinon, rediriger vers splash/login

  return (
    <>
      <CapacitorInit />
      <Routes>
        {/* Splash Screen - Accessible seulement si pas connecté */}
        <Route 
          path="/splash" 
          element={user ? <Navigate to="/dashboard" replace /> : <SplashScreen />} 
        />
        
        {/* Onboarding - Accessible seulement si pas encore vu et pas connecté */}
        <Route
          path="/onboarding"
          element={user ? <Navigate to="/dashboard" replace /> : <OnboardingScreen />}
        />
        
        {/* Login - Rediriger vers dashboard si déjà connecté */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginScreen />}
        />
        
        {/* Routes protégées - Nécessitent une authentification */}
        <Route
          path="/*"
          element={
            user ? (
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardScreen />} />
                  <Route path="/clients" element={<ClientsScreen />} />
                  <Route path="/products" element={<ProductsScreen />} />
                  <Route path="/categories" element={<CategoriesScreen />} />
                  <Route path="/stock" element={<StockScreen />} />
                  <Route path="/orders" element={<OrdersScreen />} />
                  <Route path="/orders/create" element={<CreateOrderScreen />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/splash" replace />
            )
          }
        />
        
        {/* Redirection par défaut */}
        <Route 
          path="/" 
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/splash" replace />
            )
          } 
        />
      </Routes>
    </>
  );
}

export default App;
