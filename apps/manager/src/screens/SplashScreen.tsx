import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Typography, LinearProgress } from '@mui/material';
import { Restaurant } from '@mui/icons-material';
import { storage } from '../utils/storage';
import { useAuthState } from '../hooks/useAuthState';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthState();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing systems...');

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
      setStatusText('Loading resources...');
    }, 1000);

    const finalTimeout = setTimeout(() => {
      setProgress(100);
      const onboardingCompleted = storage.getOnboardingCompleted();

      // Vérifier à nouveau si l'utilisateur s'est connecté pendant l'animation
      if (user) {
        navigate('/dashboard', { replace: true });
      } else if (!onboardingCompleted) {
        navigate('/onboarding', { replace: true });
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
        backgroundColor: '#D4C4B0', // Marron clair
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
                color: '#F5F5F5',
                mb: 1,
                letterSpacing: '-0.02em',
              }}
            >
              Le <span style={{ color: '#bd0f3b' }}>Continental</span>
            </Typography>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontFamily: "'Work Sans', sans-serif",
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                fontWeight: 300,
                color: '#9CA3AF',
              }}
            >
              Art of Management
            </Typography>
          </motion.div>
        </Box>

        {/* Bottom Loading Section */}
        <Box sx={{ width: '100%', maxWidth: 320, space: 3 }}>
          {/* Status Text */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1.5 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#bd0f3b',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                Status
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#D1D5DB',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {statusText}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontFamily: "'Work Sans', sans-serif",
                fontSize: '0.625rem',
                color: '#6B7280',
              }}
            >
              v2.4.0
            </Typography>
          </Box>

          {/* Loading Bar */}
          <Box
            sx={{
              position: 'relative',
              height: 4,
              width: '100%',
              backgroundColor: 'rgba(189, 15, 59, 0.1)',
              borderRadius: '9999px',
              overflow: 'hidden',
              mb: 2,
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                backgroundColor: '#bd0f3b',
                borderRadius: '9999px',
              }}
            />
          </Box>

          {/* Footer */}
          <Box sx={{ pt: 2, textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.625rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: '#6B7280',
              }}
            >
              Exclusive Professional Access
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Decorative Pattern */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          opacity: 0.1,
          pointerEvents: 'none',
          height: 160,
          background: 'linear-gradient(to top, rgba(189, 15, 59, 0.2), transparent)',
        }}
      />
    </Box>
  );
};

export default SplashScreen;
