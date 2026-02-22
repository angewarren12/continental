import React from 'react';
import { Card, CardContent, CardProps } from '@mui/material';
import { motion } from 'framer-motion';
import { designTokens } from '../../design-tokens';

interface ModernCardProps extends CardProps {
  hover?: boolean;
  delay?: number;
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  hover = false,
  delay = 0,
  sx,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={hover ? { y: -4 } : {}}
    >
      <Card
        {...props}
        sx={{
          backgroundColor: designTokens.colors.background.paper,
          borderRadius: designTokens.borderRadius.large,
          boxShadow: designTokens.shadows.card,
          transition: designTokens.transitions.normal,
          '&:hover': hover ? {
            boxShadow: designTokens.shadows.hover,
          } : {},
          ...sx,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ModernCard;
