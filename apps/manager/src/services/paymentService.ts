import { processPayment, PaymentResult } from '@shared/services/payment';
import { PaymentMethod } from '@shared/types/order';

/**
 * Service de paiement pour l'app gestionnaire
 * Utilise le service partagé et peut être étendu avec des fonctionnalités spécifiques
 */
export const processOrderPayment = async (
  amount: number,
  paymentMethod: PaymentMethod
): Promise<PaymentResult> => {
  return processPayment(amount, paymentMethod);
};
