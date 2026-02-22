import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { Close, ArrowForward, Inventory2, ReceiptLong } from '@mui/icons-material';
import OnboardingSlide from '../components/onboarding/OnboardingSlide';
import OnboardingPagination from '../components/onboarding/OnboardingPagination';
import { useOnboarding } from '../hooks/useOnboarding';

const onboardingData = [
  {
    title: 'Bienvenue au Continental',
    description:
      'Gérez vos commandes et suivez vos stocks en toute simplicité avec notre interface professionnelle.',
    features: [
      {
        icon: <Inventory2 sx={{ fontSize: 24 }} />,
        title: 'Stocks',
        description: 'Suivi en temps réel',
      },
      {
        icon: <ReceiptLong sx={{ fontSize: 24 }} />,
        title: 'Commandes',
        description: 'Gestion centralisée',
      },
    ],
  },
  {
    title: 'Gestion des Commandes',
    description:
      'Enregistrez rapidement les commandes de vos clients, suivez leur statut et gérez les paiements. Tout est enregistré avec date et heure pour une traçabilité complète.',
    features: [
      {
        icon: <ReceiptLong sx={{ fontSize: 24 }} />,
        title: 'Suivi en temps réel',
        description: 'Statuts des commandes',
      },
      {
        icon: <ReceiptLong sx={{ fontSize: 24 }} />,
        title: 'Paiements',
        description: 'Gestion complète',
      },
    ],
  },
  {
    title: 'Contrôle du Stock',
    description:
      'Surveillez votre stock de boissons en temps réel. Réapprovisionnez facilement et suivez tous les mouvements pour éviter les ruptures.',
    features: [
      {
        icon: <Inventory2 sx={{ fontSize: 24 }} />,
        title: 'Alertes',
        description: 'Stock faible',
      },
      {
        icon: <Inventory2 sx={{ fontSize: 24 }} />,
        title: 'Historique',
        description: 'Tous les mouvements',
      },
    ],
  },
];

const OnboardingScreen: React.FC = () => {
  const {
    currentSlide,
    totalSlides,
    nextSlide,
    previousSlide,
    goToSlide,
    completeOnboarding,
    skipOnboarding,
    isFirstSlide,
    isLastSlide,
  } = useOnboarding();

  const currentData = onboardingData[currentSlide];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#D4C4B0', // Marron clair
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Image with Overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage:
            'url(https://lh3.googleusercontent.com/aida-public/AB6AXuBtPzc4kVUVwRsXQmUFVw-T5q53BWkD4kebvcIAETgXmvaHBfMCZerGnwSe5RFrgEhBPTxfMAxP0HBjGECC2U3T31Ey0Bwlf0fAiS22I-3TwzR6ys73zSG8ZaGv2qFyYAv8aT4xmvySRqxr7FihyZFJNSepq3bKeCx7bvtrsNSsIpHmyyIcBhKWDG31J03Kgf45ENz9fbP28Tp8rPnAHwOlNGu5_GJf4f53xlYUuLBrf7H5Z8yvXWrV8tVvF-TZblEoJ8pjkyeET_rN)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(212, 196, 176, 0.4) 50%, rgba(212, 196, 176, 0.9) 100%)',
        }}
      />

      {/* Top Bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              backgroundColor: '#bd0f3b',
              p: 0.75,
              borderRadius: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                color: '#FFFFFF',
                fontSize: 24,
              }}
            >
              🍽️
            </Box>
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: '#FFFFFF',
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            Le Continental
          </Typography>
        </Box>
        <Button
          onClick={skipOnboarding}
          sx={{
            color: '#D1D5DB',
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
            '&:hover': {
              color: '#FFFFFF',
              backgroundColor: 'transparent',
            },
          }}
        >
          Passer
        </Button>
      </Box>

      {/* Content Area */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          px: 3,
          pb: 3,
          pt: 20,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            {/* Welcome Text */}
            <Box sx={{ mb: 4, maxWidth: '500px' }}>
              <Typography
                variant="h3"
                sx={{
                  color: '#FFFFFF',
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  mb: 2,
                }}
              >
                {currentData.title.split(' ').slice(0, -1).join(' ')}{' '}
                <span style={{ color: '#bd0f3b' }}>
                  {currentData.title.split(' ').slice(-1)[0]}
                </span>
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#D1D5DB',
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  lineHeight: 1.6,
                  fontWeight: 300,
                }}
              >
                {currentData.description}
              </Typography>
            </Box>

            {/* Features Preview */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2,
                mb: 4,
              }}
            >
              {currentData.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Box
                    sx={{
                      backgroundColor: 'rgba(34, 16, 21, 0.4)',
                      border: '1px solid rgba(189, 15, 59, 0.2)',
                      p: 2,
                      borderRadius: 2,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Box sx={{ color: '#bd0f3b', mb: 1 }}>{feature.icon}</Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#FFFFFF',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#9CA3AF',
                        fontSize: '0.75rem',
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        <OnboardingPagination
          totalSlides={totalSlides}
          currentSlide={currentSlide}
          onDotClick={goToSlide}
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
          {isLastSlide ? (
            <Button
              variant="contained"
              onClick={completeOnboarding}
              endIcon={<ArrowForward />}
              sx={{
                backgroundColor: '#bd0f3b',
                color: '#FFFFFF',
                fontWeight: 700,
                py: 2,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 6px rgba(189, 15, 59, 0.3)',
                '&:hover': {
                  backgroundColor: '#9a0c2f',
                },
              }}
            >
              Commencer l'expérience
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={nextSlide}
              endIcon={<ArrowForward />}
              sx={{
                backgroundColor: '#bd0f3b',
                color: '#FFFFFF',
                fontWeight: 700,
                py: 2,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 6px rgba(189, 15, 59, 0.3)',
                '&:hover': {
                  backgroundColor: '#9a0c2f',
                },
              }}
            >
              Suivant
            </Button>
          )}
          {isLastSlide && (
            <Button
              variant="outlined"
              onClick={completeOnboarding}
              sx={{
                borderColor: '#6B7280',
                color: '#FFFFFF',
                fontWeight: 500,
                py: 2,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#9CA3AF',
                  backgroundColor: 'transparent',
                },
              }}
            >
              Se connecter
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default OnboardingScreen;
