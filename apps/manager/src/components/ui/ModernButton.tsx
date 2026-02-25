import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { motion } from 'framer-motion';
import { designTokens } from '../../design-tokens';

interface ModernButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  variant = 'primary',
  children,
  sx,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: designTokens.colors.primary.main,
          color: designTokens.colors.primary.contrast,
          '&:hover': {
            backgroundColor: designTokens.colors.primary.dark,
          },
          boxShadow: designTokens.shadows.medium,
        };
      case 'secondary':
        return {
          backgroundColor: designTokens.colors.background.light,
          color: designTokens.colors.text.primary,
          '&:hover': {
            backgroundColor: designTokens.colors.background.paper,
          },
        };
      case 'outline':
        return {
          border: `2px solid ${designTokens.colors.primary.main}`,
          color: designTokens.colors.primary.main,
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: `${designTokens.colors.primary.main}10`,
            borderColor: designTokens.colors.primary.dark,
          },
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        {...props}
        sx={{
          borderRadius: designTokens.borderRadius.medium,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          py: 1.5,
          px: 3,
          transition: designTokens.transitions.normal,
          ...getVariantStyles(),
          ...sx,
        }}
      >
        {children}
      </Button>
    </motion.div>
  );
};

export default ModernButton;
