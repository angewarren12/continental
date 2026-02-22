import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition } from '../../constants/animations';

interface SlideTransitionProps {
  children: React.ReactNode;
  path: string;
}

const SlideTransition: React.FC<SlideTransitionProps> = ({ children, path }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={path}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default SlideTransition;
