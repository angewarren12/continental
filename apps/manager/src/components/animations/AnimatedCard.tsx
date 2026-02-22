import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardProps } from '@mui/material';
import { fadeIn, staggerItem } from '../../constants/animations';

interface AnimatedCardProps extends CardProps {
  delay?: number;
  children: React.ReactNode;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  delay = 0,
  children,
  sx,
  ...props
}) => {
  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      transition={{ delay }}
    >
      <Card
        {...props}
        sx={{
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)',
          },
          ...sx,
        }}
      >
        {children}
      </Card>
    </motion.div>
  );
};

export default AnimatedCard;
