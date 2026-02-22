import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  AccountCircle,
  Refresh as RefreshIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useRefresh } from '../contexts/RefreshContext';
import { fadeIn } from '../constants/animations';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { refresh, isRefreshing } = useRefresh();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    handleMenuClose();
  };


  const getCurrentTab = () => {
    if (location.pathname === '/dashboard') return 0;
    if (location.pathname === '/orders') return 1;
    if (location.pathname === '/profile') return 2;
    return 0;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#F5F5F5',
        pb: { xs: 8, sm: 0 }, // Espace pour bottom nav sur mobile
      }}
    >
      {/* AppBar - Desktop */}
      <AppBar
        position="sticky"
        sx={{
          display: { xs: 'none', sm: 'flex' },
          backgroundColor: '#bd0f3b',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          background: 'linear-gradient(135deg, #bd0f3b 0%, #9a0c2f 100%)',
        }}
      >
        <Toolbar sx={{ gap: 3, px: { sm: 3, md: 4 } }}>
          <Box
            onClick={() => navigate('/dashboard')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                transform: 'scale(1.05)',
              },
            }}
          >
            <RestaurantIcon
              sx={{
                fontSize: 32,
                color: '#FFFFFF',
              }}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={refresh}
              disabled={isRefreshing}
              sx={{ 
                color: '#FFFFFF',
                position: 'relative',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:disabled': {
                  opacity: 0.6,
                },
              }}
              title="Actualiser"
            >
              {isRefreshing ? (
                <CircularProgress 
                  size={24} 
                  sx={{ 
                    color: '#FFFFFF',
                  }} 
                />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 600,
                display: { xs: 'none', md: 'block' },
              }}
            >
              {user?.name}
            </Typography>
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              sx={{ 
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <AccountCircle />
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* AppBar - Mobile only */}
      <AppBar
        position="sticky"
        sx={{
          display: { xs: 'flex', sm: 'none' },
          backgroundColor: '#bd0f3b',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          background: 'linear-gradient(135deg, #bd0f3b 0%, #9a0c2f 100%)',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Box
            onClick={() => navigate('/dashboard')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 1.25,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                transform: 'scale(1.05)',
              },
            }}
          >
            <RestaurantIcon
              sx={{
                fontSize: 28,
                color: '#FFFFFF',
              }}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            color="inherit"
            onClick={refresh}
            disabled={isRefreshing}
            sx={{ 
              color: '#FFFFFF',
              position: 'relative',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:disabled': {
                opacity: 0.6,
              },
            }}
            title="Actualiser"
          >
            {isRefreshing ? (
              <CircularProgress 
                size={20} 
                sx={{ 
                  color: '#FFFFFF',
                }} 
              />
            ) : (
              <RefreshIcon />
            )}
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ 
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleSignOut}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
          maxWidth: { sm: '100%', md: '1200px' },
          mx: 'auto',
          width: '100%',
        }}
      >
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          key={location.pathname}
        >
          {children}
        </motion.div>
      </Box>

      {/* Bottom Navigation - Mobile only */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        <BottomNavigation
          value={getCurrentTab()}
          onChange={(_, newValue) => {
            if (newValue === 0) navigate('/dashboard');
            else if (newValue === 1) navigate('/orders');
            else if (newValue === 2) navigate('/profile');
          }}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E8E8E8',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
            zIndex: 1000,
            height: 70,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              paddingTop: 1,
              paddingBottom: 1,
              color: '#999999',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                color: '#bd0f3b',
                paddingTop: 0.5,
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: 600,
                marginTop: 0.5,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  fontSize: '0.75rem',
                  fontWeight: 700,
                },
              },
            },
          }}
        >
          <BottomNavigationAction
            label="Accueil"
            icon={
              <motion.div
                animate={location.pathname === '/dashboard' ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <DashboardIcon 
                  sx={{ 
                    fontSize: location.pathname === '/dashboard' ? 28 : 24,
                    transition: 'all 0.2s ease',
                  }} 
                />
              </motion.div>
            }
          />
          <BottomNavigationAction
            label="Commandes"
            icon={
              <motion.div
                animate={location.pathname === '/orders' ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <ReceiptIcon 
                  sx={{ 
                    fontSize: location.pathname === '/orders' ? 28 : 24,
                    transition: 'all 0.2s ease',
                  }} 
                />
              </motion.div>
            }
          />
          <BottomNavigationAction
            label="Profil"
            icon={
              <motion.div
                animate={location.pathname === '/profile' ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <PersonIcon 
                  sx={{ 
                    fontSize: location.pathname === '/profile' ? 28 : 24,
                    transition: 'all 0.2s ease',
                  }} 
                />
              </motion.div>
            }
          />
        </BottomNavigation>
      </Box>
    </Box>
  );
};

export default Layout;
