import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardProps } from '@mui/material';
import { designTokens } from '../../design-tokens';

interface AnimatedCardProps extends CardProps {
  delay?: number;
  hover?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  delay = 0,
  hover = false,
  sx,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay, 
        ease: [0.4, 0, 0.2, 1] 
      }}
      whileHover={hover ? { y: -4 } : {}}
      style={{ height: '100%' }}
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
        {children}
      </Card>
    </motion.div>
  );
};

export default AnimatedCard;
