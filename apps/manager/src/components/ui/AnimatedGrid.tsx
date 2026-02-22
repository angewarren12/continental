import React from 'react';
import { motion } from 'framer-motion';
import { Grid, GridProps } from '@mui/material';

interface AnimatedGridProps extends GridProps {
  delay?: number;
  staggerDelay?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const AnimatedGrid: React.FC<AnimatedGridProps> = ({ 
  children, 
  delay = 0, 
  staggerDelay = 0.1,
  ...props 
}) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ width: '100%' }}
    >
      <Grid {...props}>
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            custom={index}
            style={{ height: '100%' }}
          >
            {child}
          </motion.div>
        ))}
      </Grid>
    </motion.div>
  );
};

export default AnimatedGrid;
