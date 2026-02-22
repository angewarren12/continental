import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

interface OnboardingPaginationProps {
  totalSlides: number;
  currentSlide: number;
  onDotClick: (index: number) => void;
}

const OnboardingPagination: React.FC<OnboardingPaginationProps> = ({
  totalSlides,
  currentSlide,
  onDotClick,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        justifyContent: 'center',
        alignItems: 'center',
        mb: 4,
      }}
    >
      {Array.from({ length: totalSlides }).map((_, index) => (
        <motion.div
          key={index}
          onClick={() => onDotClick(index)}
          style={{ cursor: 'pointer' }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <Box
            sx={{
              width: currentSlide === index ? 32 : 8,
              height: 6,
              borderRadius: 3,
              backgroundColor: currentSlide === index ? '#bd0f3b' : '#4B5563',
              transition: 'all 0.3s ease',
            }}
          />
        </motion.div>
      ))}
    </Box>
  );
};

export default OnboardingPagination;
