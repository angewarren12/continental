import { apiClient } from './client';
import { Order, OrderCreateInput, OrderUpdateInput } from '../types/order';

export const getOrders = async (filters?: {
  clientId?: number;
  status?: string;
  paymentStatus?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<Order[]> => {
  const params = new URLSearchParams();
  if (filters?.clientId) params.append('clientId', String(filters.clientId));
  if (filters?.status) params.append('status', filters.status);
  if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
  
  const queryString = params.toString();
  const endpoint = queryString ? `/orders?${queryString}` : '/orders';
  
  const response = await apiClient.get<{ orders: Order[] }>(endpoint);
  
  let orders = response.orders;
  
  // Filtrer par date côté client si nécessaire
  if (filters?.startDate || filters?.endDate) {
    orders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      if (filters.startDate && orderDate < filters.startDate) return false;
      if (filters.endDate && orderDate > filters.endDate) return false;
      return true;
    });
  }
  
  return orders;
};

export const getOrder = async (orderId: number): Promise<Order | null> => {
  try {
    const response = await apiClient.get<{ order: Order }>(`/orders/${orderId}`);
    return response.order;
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('non trouvé')) {
      return null;
    }
    throw error;
  }
};

export const createOrder = async (
  orderData: OrderCreateInput
): Promise<Order> => {
  console.log('[API] ===== DÉBUT createOrder =====');
  console.log('[API] Données reçues:', orderData);
  console.log('[API] Items count:', orderData.items?.length);
  console.log('[API] Items détaillés:', orderData.items);
  
  // Validation des données avant envoi
  if (!orderData.clientId) {
    console.error('[API] ERREUR: clientId manquant');
    throw new Error('clientId est requis');
  }
  
  if (!orderData.items || orderData.items.length === 0) {
    console.error('[API] ERREUR: items manquant ou vide');
    throw new Error('items est requis et ne doit pas être vide');
  }
  
  // Validation de chaque item
  const invalidItems = orderData.items.filter((item, index) => {
    const isValid = item.productId && item.productName && item.quantity > 0 && item.unitPrice >= 0;
    if (!isValid) {
      console.error(`[API] Item ${index} invalide:`, item);
    }
    return !isValid;
  });
  
  if (invalidItems.length > 0) {
    console.error('[API] ERREUR: Items invalides détectés:', invalidItems);
    throw new Error(`${invalidItems.length} items invalides détectés`);
  }
  
  console.log('[API] Validation OK - Envoi de la requête...');
  
  try {
    // Le backend récupère automatiquement le managerId depuis le token JWT
    const response = await apiClient.post<{ order: Order }>('/orders', orderData);
    console.log('[API] Réponse reçue:', response);
    console.log('[API] Commande créée:', response.order);
    console.log('[API] ===== FIN createOrder - SUCCÈS =====');
    return response.order;
  } catch (error: any) {
    console.error('[API] ===== ERREUR createOrder =====');
    console.error('[API] Erreur:', error);
    console.error('[API] Message erreur:', error.message);
    console.error('[API] Response:', error.response);
    console.error('[API] Request:', error.request);
    console.log('[API] ===== FIN ERREUR createOrder =====');
    throw error;
  }
};

export const updateOrder = async (
  orderId: number,
  orderData: OrderUpdateInput
): Promise<Order> => {
  const response = await apiClient.put<{ order: Order }>(`/orders/${orderId}`, orderData);
  return response.order;
};

export const getClientOrders = async (clientId: number): Promise<Order[]> => {
  return getOrders({ clientId });
};

export interface CreatePaymentInput {
  orderId: number;
  amount: number;
  method: 'cash' | 'wave';
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  method: 'cash' | 'wave';
  createdBy: number;
  createdAt: Date | string;
}

export const createPayment = async (
  paymentData: CreatePaymentInput
): Promise<{ payment: Payment; order: Order }> => {
  // Ne pas envoyer orderId dans le body car il est dans l'URL
  const { orderId, ...bodyData } = paymentData;
  const response = await apiClient.post<{ payment: Payment; order: Order }>(
    `/orders/${orderId}/payments`,
    bodyData
  );
  return response;
};

export interface AddItemsToOrderInput {
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export const addItemsToOrder = async (
  orderId: number,
  itemsData: AddItemsToOrderInput
): Promise<Order> => {
  const response = await apiClient.post<{ order: Order }>(
    `/orders/${orderId}/items`,
    itemsData
  );
  return response.order;
};

export interface AddOrderSupplementsInput {
  supplements: Array<{
    supplementId: number;
    supplementName: string;
    supplementPrice: number;
    quantity: number;
  }>;
}

export const addOrderSupplements = async (
  orderId: number,
  orderItemId: number,
  supplementsData: AddOrderSupplementsInput
): Promise<{ success: boolean }> => {
  const response = await apiClient.post<{ success: boolean }>(
    `/orders/${orderId}/items/${orderItemId}/supplements`,
    supplementsData
  );
  return response;
};