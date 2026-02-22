import React from 'react';
import { motion } from 'framer-motion';
import { Typography, Box } from '@mui/material';
import { designTokens } from '../../design-tokens';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  delay?: number;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: designTokens.colors.text.primary,
            fontSize: designTokens.typography.h4.fontSize,
            mb: subtitle ? 0.5 : 0,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: designTokens.colors.text.secondary,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </motion.div>
  );
};

export default SectionTitle;
