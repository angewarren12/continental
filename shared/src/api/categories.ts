import { apiClient } from './client';
import { Category, CategoryCreationAttributes, CategoryUpdateAttributes } from '../types/category';

export interface GetCategoriesResponse {
  categories: Category[];
}

export interface GetCategoryResponse {
  category: Category;
}

export interface CreateCategoryResponse {
  category: Category;
}

export interface UpdateCategoryResponse {
  category: Category;
}

export interface DeleteCategoryResponse {
  message: string;
}

/**
 * Récupérer toutes les catégories
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<GetCategoriesResponse>('/categories');
  return response.categories;
};

/**
 * Récupérer une catégorie par ID
 */
export const getCategory = async (id: number): Promise<Category> => {
  const response = await apiClient.get<GetCategoryResponse>(`/categories/${id}`);
  return response.category;
};

/**
 * Créer une catégorie
 */
export const createCategory = async (data: CategoryCreationAttributes): Promise<Category> => {
  const response = await apiClient.post<CreateCategoryResponse>('/categories', data);
  return response.category;
};

/**
 * Mettre à jour une catégorie
 */
export const updateCategory = async (
  id: number,
  data: CategoryUpdateAttributes
): Promise<Category> => {
  const response = await apiClient.put<UpdateCategoryResponse>(`/categories/${id}`, data);
  return response.category;
};

/**
 * Supprimer une catégorie
 */
export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete<DeleteCategoryResponse>(`/categories/${id}`);
};
