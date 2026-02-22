/**
 * Utilitaires Capacitor pour les fonctionnalités natives
 */

import { App } from '@capacitor/app';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Initialise les notifications push
 */
export const initializePushNotifications = async () => {
  // Vérifier si on est sur une plateforme native
  const { Capacitor } = await import('@capacitor/core');
  if (!Capacitor.isNativePlatform()) {
    // Ne pas initialiser sur le web
    return;
  }

  try {
    // Demander la permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('Permission de notification refusée');
    }

    // S'enregistrer pour les notifications
    await PushNotifications.register();

    // Écouter les événements
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ' + JSON.stringify(notification));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed', notification.actionId, notification.inputValue);
    });
  } catch (error: any) {
    // Ignorer les erreurs sur le web
    if (error.message && error.message.includes('not implemented')) {
      return;
    }
    throw error;
  }
};

/**
 * Prend une photo avec la caméra
 */
export const takePicture = async (): Promise<string> => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });

    return image.dataUrl || '';
  } catch (error) {
    console.error('Error taking picture:', error);
    throw error;
  }
};

/**
 * Sélectionne une image depuis la galerie
 */
export const pickImage = async (): Promise<string> => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });

    return image.dataUrl || '';
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Envoie une notification locale
 */
export const sendLocalNotification = async (title: string, body: string) => {
  // Les notifications locales nécessitent généralement un plugin supplémentaire
  // Pour l'instant, on utilise les notifications push
  console.log('Local notification:', title, body);
};

/**
 * Vibre le téléphone
 */
export const vibrate = async (style: ImpactStyle = ImpactStyle.Medium) => {
  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.error('Error vibrating:', error);
  }
};

/**
 * Vérifie si l'app est en arrière-plan
 */
export const isAppInBackground = async (): Promise<boolean> => {
  try {
    const state = await App.getState();
    return !state.isActive;
  } catch (error) {
    return false;
  }
};
