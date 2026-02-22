// Helpers pour les animations

export const createStaggerAnimation = (delay: number = 0.1) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: delay,
    },
  },
});

export const createFadeInUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.3 },
});

export const createScaleIn = (delay: number = 0) => ({
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { delay, duration: 0.3, type: 'spring' },
});

export const shakeAnimation = {
  x: [0, -10, 10, -10, 10, 0],
  transition: { duration: 0.5 },
};

export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const rotateAnimation = {
  rotate: [0, 360],
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};
