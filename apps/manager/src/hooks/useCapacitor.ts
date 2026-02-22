import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { initializePushNotifications } from '@shared/utils/capacitor';

/**
 * Hook pour initialiser les fonctionnalités Capacitor
 */
export const useCapacitor = () => {
  useEffect(() => {
    // Vérifier si on est sur une plateforme native
    if (!Capacitor.isNativePlatform()) {
      return; // Ne pas initialiser sur le web
    }

    // Initialiser les notifications push
    initializePushNotifications().catch((error) => {
      console.error('Error initializing push notifications:', error);
    });

    // Écouter les événements de l'app
    let backButtonListener: any = null;
    
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    }).then((listener) => {
      backButtonListener = listener;
    });

    return () => {
      if (backButtonListener && typeof backButtonListener.remove === 'function') {
        backButtonListener.remove();
      }
    };
  }, []);
};
