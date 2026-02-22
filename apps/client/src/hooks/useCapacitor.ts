import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { initializePushNotifications } from '@shared/utils/capacitor';

/**
 * Hook pour initialiser les fonctionnalités Capacitor
 */
export const useCapacitor = () => {
  useEffect(() => {
    // Initialiser les notifications push
    initializePushNotifications().catch((error) => {
      console.error('Error initializing push notifications:', error);
    });

    // Écouter les événements de l'app
    let backButtonListener: any = null;
    
    const setupBackButton = async () => {
      backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
    };

    setupBackButton();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, []);
};
