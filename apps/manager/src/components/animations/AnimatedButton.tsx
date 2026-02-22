import React from 'react';
import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@mui/material';

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  sx,
  ...props
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        {...props}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          ...sx,
        }}
      >
        {children}
      </Button>
    </motion.div>
  );
};

export default AnimatedButton;
