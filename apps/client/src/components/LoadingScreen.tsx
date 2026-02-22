import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        backgroundColor: '#F5F5F5',
      }}
    >
      <CircularProgress size={60} sx={{ color: '#bd0f3b' }} />
      <Typography variant="h6" sx={{ color: '#666666', fontWeight: 500 }}>
        Chargement...
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
