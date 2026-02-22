import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';

export const useOnboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const totalSlides = 3;

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  };

  const completeOnboarding = () => {
    storage.setOnboardingCompleted(true);
    navigate('/login', { replace: true });
  };

  const skipOnboarding = () => {
    storage.setOnboardingCompleted(true);
    navigate('/login', { replace: true });
  };

  return {
    currentSlide,
    totalSlides,
    nextSlide,
    previousSlide,
    goToSlide,
    completeOnboarding,
    skipOnboarding,
    isFirstSlide: currentSlide === 0,
    isLastSlide: currentSlide === totalSlides - 1,
  };
};
