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
} from '@mui/material';
import {
  Logout as LogoutIcon,
  AccountCircle,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from './navigation/BottomNav';
import { fadeIn } from '../constants/animations';
import Logo from './Logo';

const drawerWidth = 240;

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
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

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/clients': 'Clients',
      '/products': 'Produits',
      '/stock': 'Stock',
      '/orders': 'Commandes',
      '/orders/create': 'Nouvelle Commande',
    };
    return titles[location.pathname] || 'Le Continental';
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
          <Logo size="medium" onClick={() => navigate('/dashboard')} />
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#FFFFFF',
                fontSize: '1.125rem',
                letterSpacing: '0.01em',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              {getPageTitle()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          <Logo size="medium" onClick={() => navigate('/dashboard')} />
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: '#FFFFFF',
              fontSize: '1rem',
              letterSpacing: '0.01em',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            }}
          >
            {getPageTitle()}
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
        <BottomNav />
      </Box>
    </Box>
  );
};

export default Layout;
