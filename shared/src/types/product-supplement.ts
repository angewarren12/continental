export interface ProductSupplement {
  id: number;
  productId: number;
  supplementId: number;
  isAvailable: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductSupplementCreateInput {
  productId: number;
  supplementId: number;
  isAvailable?: boolean;
}

export interface ProductSupplementUpdateInput {
  isAvailable?: boolean;
}
