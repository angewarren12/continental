export type ProductCategory = 'food' | 'drink' | 'service';

export type ProductTypeEnum =
  | 'spaghetti'
  | 'roasted_chicken'
  | 'beer'
  | 'wine'
  | 'billiard_table'
  | 'room_500';

export type ProductType = 'food' | 'dish' | 'drink' | 'cigarette' | 'egg' | 'supplement' | 'service';
export type StockUnit = 'packet' | 'unit' | 'plate';
export type SaleUnit = 'packet' | 'unit' | 'plate';

import { Category } from './category';

export interface ProductSupplement {
  id?: number;
  productId?: number;
  supplementId?: number | null;
  supplement_name?: string | null;
  supplement_price?: number | null;
  isAvailable?: boolean;
}

export interface Product {
  id: number;
  name: string;
  categoryId: number;
  productType: ProductType;
  stockUnit?: StockUnit;
  saleUnit?: SaleUnit;
  conversionFactor?: number;
  imageUrl?: string;
  description?: string;
  price: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  categoryDetail?: Category;
  supplements?: ProductSupplement[];
  // Virtual property or computed based on existence in stock
  hasStock?: boolean;
}

export interface ProductCreateInput {
  name: string;
  categoryId?: number;
  productType?: ProductType;
  stockUnit?: StockUnit;
  saleUnit?: SaleUnit;
  conversionFactor?: number;
  imageUrl?: string;
  description?: string;
  price: number;
  supplements?: ProductSupplement[];
  // Transient fields for stock creation
  hasStock?: boolean;
  stockQuantity?: number;
}

export interface ProductUpdateInput {
  name?: string;
  categoryId?: number | null;
  productType?: ProductType;
  stockUnit?: StockUnit | null;
  saleUnit?: SaleUnit;
  conversionFactor?: number | null;
  imageUrl?: string | null;
  description?: string | null;
  price?: number;
  isActive?: boolean;
  supplements?: ProductSupplement[];
  // Transient field for stock update
  stockQuantity?: number | null;
}
