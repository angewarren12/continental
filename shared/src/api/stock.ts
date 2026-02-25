import { apiClient } from './client';
import { Stock, StockMovement, StockUpdateInput } from '../types/stock';

export const getAllStocks = async (filters?: {
  categoryId?: number;
}): Promise<Stock[]> => {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.append('categoryId', String(filters.categoryId));
  
  const queryString = params.toString();
  const endpoint = queryString ? `/stock?${queryString}` : '/stock';
  
  const response = await apiClient.get<{ stocks: Stock[]; statistics?: any }>(endpoint);
  return response.stocks;
};

export const getStock = async (productId: number): Promise<Stock | null> => {
  try {
    const response = await apiClient.get<{ stock: Stock }>(`/stock/${productId}`);
    return response.stock;
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('non trouvé')) {
      return null;
    }
    throw error;
  }
};

export const updateStock = async (
  productId: number,
  stockData: StockUpdateInput
): Promise<Stock> => {
  // Le backend récupère automatiquement le userId depuis le token JWT
  const response = await apiClient.put<{ stock: Stock }>(`/stock/${productId}`, {
    quantity: stockData.quantity,
    quantityPackets: stockData.quantityPackets,
    quantityUnits: stockData.quantityUnits,
    quantityPlates: stockData.quantityPlates,
    type: stockData.type,
  });
  return response.stock;
};

export const getStockMovements = async (productId?: number): Promise<StockMovement[]> => {
  if (productId) {
    const response = await apiClient.get<{ movements: StockMovement[] }>(
      `/stock/${productId}/movements`
    );
    return response.movements;
  }
  
  // Si pas de productId, récupérer tous les mouvements (nécessite une route backend supplémentaire)
  // Pour l'instant, on retourne un tableau vide
  return [];
};
