export type StockMovementType = 'sale' | 'restock' | 'adjustment';

export interface Stock {
  id: number;
  productId: number;
  quantity: number;
  lastUpdated: Date | string;
  updatedBy: number;
}

export interface StockMovement {
  id: number;
  productId: number;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  orderId?: number;
  createdAt: Date | string;
  createdBy: number;
}

export interface StockUpdateInput {
  productId: number;
  quantity: number;
  type: StockMovementType;
  orderId?: number;
}
