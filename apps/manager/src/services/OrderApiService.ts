import { Order, OrderItem } from '@shared/types/order';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OrderSupplement {
  id: number;
  order_id: number;
  order_item_id: number;
  supplement_id: number;
  supplement_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrderRequest {
  clientId: number;
  items: OrderItem[];
  supplements?: OrderSupplement[];
  tableNumber?: string;
  notes?: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  method?: string;
}

export interface UpdateOrderRequest extends Partial<CreateOrderRequest> {
  id: number;
}

/**
 * Service API pour la gestion des commandes
 */
class OrderApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Crée une nouvelle commande
   */
  async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Commande créée avec succès',
      };
    } catch (error: any) {
      console.error('Erreur lors de la création de la commande:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la commande',
      };
    }
  }

  /**
   * Met à jour une commande existante
   */
  async updateOrder(orderId: number, orderData: UpdateOrderRequest): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Commande mise à jour avec succès',
      };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour de la commande',
      };
    }
  }

  /**
   * Récupère une commande par son ID
   */
  async getOrder(orderId: number): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la commande:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération de la commande',
      };
    }
  }

  /**
   * Récupère la liste des commandes
   */
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    clientId?: number;
  }): Promise<ApiResponse<{ orders: Order[]; total: number }>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.status) searchParams.append('status', params.status);
      if (params?.clientId) searchParams.append('clientId', params.clientId.toString());

      const response = await fetch(`${this.baseUrl}/orders?${searchParams}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des commandes:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des commandes',
      };
    }
  }

  /**
   * Supprime une commande
   */
  async deleteOrder(orderId: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
      
      return {
        success: true,
        message: 'Commande supprimée avec succès',
      };
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la commande:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression de la commande',
      };
    }
  }

  /**
   * Change le statut d'une commande
   */
  async updateOrderStatus(
    orderId: number, 
    status: string, 
    reason?: string
  ): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Statut mis à jour avec succès',
      };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du statut',
      };
    }
  }

  /**
   * Ajoute un paiement à une commande
   */
  async addPayment(
    orderId: number,
    amount: number,
    method: string,
    reference?: string
  ): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, method, reference }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Paiement ajouté avec succès',
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du paiement:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'ajout du paiement',
      };
    }
  }

  /**
   * Duplique une commande
   */
  async duplicateOrder(orderId: number): Promise<ApiResponse<Order>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Commande dupliquée avec succès',
      };
    } catch (error: any) {
      console.error('Erreur lors de la duplication de la commande:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la duplication de la commande',
      };
    }
  }

  /**
   * Récupère l'historique d'une commande
   */
  async getOrderHistory(orderId: number): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/history`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération de l\'historique',
      };
    }
  }

  /**
   * Ajoute des suppléments à un item de commande
   */
  async addOrderSupplements(
    orderId: number,
    orderItemId: number,
    supplements: Omit<OrderSupplement, 'id' | 'order_id' | 'order_item_id' | 'created_at' | 'updated_at'>[]
  ): Promise<ApiResponse<OrderSupplement[]>> {
    try {
      const supplementsData = supplements.map(supplement => ({
        order_id: orderId,
        order_item_id: orderItemId,
        supplement_id: supplement.supplement_id,
        supplement_name: supplement.supplement_name,
        quantity: supplement.quantity,
        unit_price: supplement.unit_price,
        total_price: supplement.total_price,
      }));

      const response = await fetch(`${this.baseUrl}/orders/${orderId}/supplements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supplements: supplementsData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Suppléments ajoutés avec succès',
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout des suppléments:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'ajout des suppléments',
      };
    }
  }

  /**
   * Met à jour un supplément de commande
   */
  async updateOrderSupplement(
    supplementId: number,
    updates: Partial<Pick<OrderSupplement, 'quantity' | 'unit_price' | 'total_price'>>
  ): Promise<ApiResponse<OrderSupplement>> {
    try {
      const response = await fetch(`${this.baseUrl}/order-supplements/${supplementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Supplément mis à jour avec succès',
      };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du supplément:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du supplément',
      };
    }
  }

  /**
   * Supprime un supplément de commande
   */
  async deleteOrderSupplement(supplementId: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/order-supplements/${supplementId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
      
      return {
        success: true,
        message: 'Supplément supprimé avec succès',
      };
    } catch (error: any) {
      console.error('Erreur lors de la suppression du supplément:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression du supplément',
      };
    }
  }

  /**
   * Récupère les suppléments d'une commande
   */
  async getOrderSupplements(orderId: number): Promise<ApiResponse<OrderSupplement[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/supplements`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des suppléments:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des suppléments',
      };
    }
  }

  /**
   * Calcule le total d'une commande (simulation)
   */
  async calculateOrderTotal(orderData: CreateOrderRequest): Promise<ApiResponse<{ total: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Erreur lors du calcul du total:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors du calcul du total',
      };
    }
  }
}

// Instance singleton du service
export const orderApiService = new OrderApiService();

export default orderApiService;
