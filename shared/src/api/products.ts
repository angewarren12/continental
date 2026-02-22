import { apiClient } from './client';
import { Product, ProductCreateInput, ProductUpdateInput } from '../types/product';

export const getProducts = async (filters?: {
  category?: string;
  categoryId?: number;
  isActive?: boolean;
}): Promise<Product[]> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.categoryId) params.append('categoryId', String(filters.categoryId));
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  
  const queryString = params.toString();
  const endpoint = queryString ? `/products?${queryString}` : '/products';
  
  const response = await apiClient.get<{ products: Product[] }>(endpoint);
  return response.products;
};

export const getProduct = async (productId: number): Promise<Product | null> => {
  try {
    const response = await apiClient.get<{ product: Product }>(`/products/${productId}`);
    return response.product;
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('non trouvé')) {
      return null;
    }
    throw error;
  }
};

export const createProduct = async (productData: ProductCreateInput): Promise<Product> => {
  const response = await apiClient.post<{ product: Product }>('/products', productData);
  return response.product;
};

export const updateProduct = async (
  productId: number,
  productData: ProductUpdateInput
): Promise<Product> => {
  const response = await apiClient.put<{ product: Product }>(`/products/${productId}`, productData);
  return response.product;
};

export const deleteProduct = async (productId: number): Promise<void> => {
  await apiClient.delete(`/products/${productId}`);
};
