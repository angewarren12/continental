import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.9 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          py: 1,
          px: 2,
          borderRadius: 2,
          width: '100%',
          transition: 'all 0.2s ease',
          color: active ? '#DC143C' : '#666666',
          '&:hover': {
            backgroundColor: 'rgba(220, 20, 60, 0.05)',
          },
        }}
      >
        <motion.div
          animate={{ scale: active ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.7rem',
            fontWeight: active ? 600 : 400,
            mt: 0.5,
            color: active ? '#DC143C' : '#666666',
          }}
        >
          {label}
        </Typography>
        {active && (
          <motion.div
            layoutId="activeIndicator"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: '#DC143C',
              borderRadius: '3px 3px 0 0',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </Box>
    </motion.div>
  );
};

export default NavItem;
