import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { designTokens } from '../../design-tokens';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
  onClick?: () => void;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = designTokens.colors.primary.main,
  subtitle,
  onClick,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ height: '100%' }}
    >
      <Card
        onClick={onClick}
        sx={{
          height: { xs: '140px', sm: '150px', md: '160px' },
          minHeight: { xs: '140px', sm: '150px', md: '160px' },
          width: '100%',
          cursor: onClick ? 'pointer' : 'default',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: designTokens.borderRadius.large,
          boxShadow: designTokens.shadows.card,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: designTokens.transitions.normal,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          },
          '&:hover': onClick ? {
            boxShadow: designTokens.shadows.hover,
            transform: 'translateY(-4px)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
          } : {},
        }}
      >
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flex: 1 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: designTokens.colors.text.secondary,
                  fontSize: designTokens.typography.caption.fontSize,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: designTokens.colors.text.primary,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  fontWeight: 700,
                  mt: 0.5,
                  lineHeight: 1.2,
                }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: designTokens.colors.text.secondary,
                    fontSize: '0.75rem',
                    mt: 0.5,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                backgroundColor: `${color}15`,
                borderRadius: designTokens.borderRadius.medium,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ color, fontSize: '1.75rem' }}>{icon}</Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
