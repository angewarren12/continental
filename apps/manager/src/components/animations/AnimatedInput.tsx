import React from 'react';
import { motion } from 'framer-motion';
import { TextField, TextFieldProps } from '@mui/material';

interface AnimatedInputProps extends TextFieldProps {
  delay?: number;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  delay = 0,
  sx,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <TextField
        {...props}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&:hover fieldset': {
              borderColor: '#DC143C',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#DC143C',
            },
          },
          ...sx,
        }}
      />
    </motion.div>
  );
};

export default AnimatedInput;
