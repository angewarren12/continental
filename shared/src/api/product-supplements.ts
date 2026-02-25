import { apiClient } from './client';
import { ProductSupplement, ProductSupplementCreateInput, ProductSupplementUpdateInput } from '../types/product-supplement';
import { Product } from '../types/product';

export const getProductSupplements = async (productId: number): Promise<ProductSupplement[]> => {
  const response = await apiClient.get<{ supplements: ProductSupplement[] }>(
    `/products/${productId}/supplements`
  );
  return response.supplements;
};

export const addProductSupplement = async (
  productId: number,
  supplementData: ProductSupplementCreateInput
): Promise<ProductSupplement> => {
  const response = await apiClient.post<{ supplement: ProductSupplement }>(
    `/products/${productId}/supplements`,
    supplementData
  );
  return response.supplement;
};

export const removeProductSupplement = async (
  productId: number,
  supplementId: number
): Promise<void> => {
  await apiClient.delete(`/products/${productId}/supplements/${supplementId}`);
};

export const updateProductSupplement = async (
  productId: number,
  supplementId: number,
  supplementData: ProductSupplementUpdateInput
): Promise<ProductSupplement> => {
  const response = await apiClient.put<{ supplement: ProductSupplement }>(
    `/products/${productId}/supplements/${supplementId}`,
    supplementData
  );
  return response.supplement;
};
