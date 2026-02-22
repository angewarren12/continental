import React from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '../../constants/animations';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.3,
}) => {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay, duration }}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
