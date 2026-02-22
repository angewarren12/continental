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
  // Le backend récupère automatiquement le managerId depuis le token JWT
  const response = await apiClient.post<{ order: Order }>('/orders', orderData);
  return response.order;
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
  paymentMethod: 'cash' | 'wave';
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  paymentMethod: 'cash' | 'wave';
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