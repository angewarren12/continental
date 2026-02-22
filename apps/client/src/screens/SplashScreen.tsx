import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Typography, LinearProgress } from '@mui/material';
import { Restaurant } from '@mui/icons-material';
import { useAuthState } from '../hooks/useAuthState';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthState();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initialisation...');

  useEffect(() => {
    // Si l'utilisateur est déjà chargé et connecté, rediriger immédiatement
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Attendre que le chargement soit terminé avant de continuer
    if (loading) {
      return;
    }

    // Si le chargement est terminé et qu'il n'y a pas d'utilisateur, continuer avec le splash
    // Animation de la barre de progression
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // Changement du texte de statut
    const statusTimeout = setTimeout(() => {
      setStatusText('Chargement...');
    }, 1000);

    const finalTimeout = setTimeout(() => {
      setProgress(100);
      // Vérifier à nouveau si l'utilisateur s'est connecté pendant l'animation
      if (user) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(statusTimeout);
      clearTimeout(finalTimeout);
    };
  }, [user, loading, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#221015',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        p: 3,
      }}
    >
      {/* Background Accents */}
      <Box
        sx={{
          position: 'absolute',
          top: -96,
          left: -96,
          width: 384,
          height: 384,
          borderRadius: '50%',
          background: 'rgba(189, 15, 59, 0.05)',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -96,
          right: -96,
          width: 384,
          height: 384,
          borderRadius: '50%',
          background: 'rgba(189, 15, 59, 0.05)',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />

      {/* Main Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          maxWidth: '400px',
          width: '100%',
          py: 6,
        }}
      >
        {/* Top Spacer */}
        <Box sx={{ height: 48 }} />

        {/* Central Branding */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* Logo Symbol */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
          >
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 3,
                backgroundColor: 'rgba(189, 15, 59, 0.1)',
                border: '1px solid rgba(189, 15, 59, 0.2)',
              }}
            >
              <Restaurant
                sx={{
                  fontSize: 56,
                  color: '#bd0f3b',
                }}
              />
            </Box>
          </motion.div>

          {/* Brand Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Work Sans', sans-serif",
                fontWeight: 700,
                fontSize: '1.75rem',
                color: '#FFFFFF',
                mb: 1,
                letterSpacing: '-0.01em',
              }}
            >
              Le Continental
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Work Sans', sans-serif",
                fontWeight: 400,
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: '0.01em',
              }}
            >
              Application Cliente
            </Typography>
          </motion.div>
        </Box>

        {/* Bottom Progress */}
        <Box
          sx={{
            width: '100%',
            maxWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{ width: '100%' }}
          >
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                width: '100%',
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#bd0f3b',
                  borderRadius: 2,
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontFamily: "'Work Sans', sans-serif",
                fontWeight: 400,
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.6)',
                mt: 1.5,
                textAlign: 'center',
                display: 'block',
              }}
            >
              {statusText}
            </Typography>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default SplashScreen;
