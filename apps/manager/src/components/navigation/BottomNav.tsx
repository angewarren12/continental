import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Paper } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalBar as LocalBarIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import NavItem from './NavItem';

const navItems = [
  { icon: <DashboardIcon />, label: 'Accueil', path: '/dashboard' },
  { icon: <PeopleIcon />, label: 'Clients', path: '/clients' },
  { icon: <ReceiptIcon />, label: 'Commandes', path: '/orders' },
  { icon: <LocalBarIcon />, label: 'Stock', path: '/stock' },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: '16px 16px 0 0',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          py: 1,
          px: 1,
          position: 'relative',
        }}
      >
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default BottomNav;
