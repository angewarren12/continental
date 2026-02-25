export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'cash' | 'wave';

export interface OrderItem {
  id?: number;
  productId: number;
  parentItemId?: number;
  isSupplement?: boolean;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  method: PaymentMethod;
  createdBy: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface User {
  id: number;
  name: string;
  phoneNumber: string;
}

export interface Order {
  id: number;
  clientId: number;
  client?: User;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  payments?: Payment[];
  createdAt: Date | string;
  completedAt?: Date | string;
  createdBy: number;
  tableNumber?: string;
}

export interface OrderCreateInput {
  clientId: number;
  items: Omit<OrderItem, 'totalPrice'>[];
  tableNumber?: string;
}

export interface OrderUpdateInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  tableNumber?: string;
}
