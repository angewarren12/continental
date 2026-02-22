/**
 * Nettoie et formate un numéro de téléphone
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Supprimer tous les espaces et caractères non numériques sauf +
  let cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Si le numéro commence par 0, le remplacer par +225
  if (cleaned.startsWith('0')) {
    cleaned = '+225' + cleaned.substring(1);
  }
  
  // Si le numéro ne commence pas par +, ajouter +225
  if (!cleaned.startsWith('+')) {
    cleaned = '+225' + cleaned;
  }
  
  return cleaned;
};
