export type ProductCategory = 'food' | 'drink' | 'service';

export type ProductType =
  | 'spaghetti'
  | 'roasted_chicken'
  | 'beer'
  | 'wine'
  | 'billiard_table'
  | 'room_500';

import { Category } from './category';

export interface Product {
  id: number;
  name: string;
  category: ProductCategory;
  categoryId?: number;
  type: ProductType;
  imageUrl?: string;
  description?: string;
  price: number;
  hasStock: boolean;
  stockQuantity?: number;
  unit?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  categoryDetail?: Category;
}

export interface ProductCreateInput {
  name: string;
  category: ProductCategory;
  categoryId?: number;
  type: ProductType;
  imageUrl?: string;
  description?: string;
  price: number;
  hasStock: boolean;
  stockQuantity?: number;
  unit?: string;
}

export interface ProductUpdateInput {
  name?: string;
  categoryId?: number | null;
  imageUrl?: string | null;
  description?: string | null;
  price?: number;
  stockQuantity?: number;
  isActive?: boolean;
}
