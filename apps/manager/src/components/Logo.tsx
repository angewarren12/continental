import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', onClick }) => {
  const sizes = {
    small: { fontSize: '1rem', letterSpacing: '0.05em' },
    medium: { fontSize: '1.25rem', letterSpacing: '0.08em' },
    large: { fontSize: '1.5rem', letterSpacing: '0.1em' },
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <motion.div
        whileHover={onClick ? { scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
      >
        <Box
          sx={{
            width: size === 'small' ? 32 : size === 'medium' ? 40 : 48,
            height: size === 'small' ? 32 : size === 'medium' ? 40 : 48,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '"C"',
              fontSize: sizes[size].fontSize,
              fontWeight: 900,
              color: '#bd0f3b',
              fontFamily: 'serif',
            },
          }}
        />
      </motion.div>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          color: '#FFFFFF',
          fontSize: sizes[size].fontSize,
          letterSpacing: sizes[size].letterSpacing,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          fontFamily: 'serif',
        }}
      >
        Continental
      </Typography>
    </Box>
  );
};

export default Logo;
