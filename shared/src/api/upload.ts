import { apiClient } from './client';

export interface UploadProductImageResponse {
  imageUrl: string;
  filename: string;
  size: number;
}

/**
 * Upload une image de produit
 */
export const uploadProductImage = async (file: File): Promise<UploadProductImageResponse> => {
  const formData = new FormData();
  formData.append('image', file);

  const token = apiClient.getToken();
  // @ts-ignore - Vite injects import.meta.env at build time
  const API_BASE_URL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:3002/api';
  const url = `${API_BASE_URL}/upload/product-image`;

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `Erreur HTTP: ${response.status}`,
    }));
    throw new Error(errorData.error || 'Erreur lors de l\'upload de l\'image');
  }

  return await response.json();
};
