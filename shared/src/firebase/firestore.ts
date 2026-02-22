import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  increment,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { User, UserCreateInput, UserUpdateInput } from '../types/user';
import { Product, ProductCreateInput, ProductUpdateInput } from '../types/product';
import { Order, OrderCreateInput, OrderUpdateInput, OrderItem } from '../types/order';
import { Stock, StockMovement, StockUpdateInput } from '../types/stock';

// Helper pour convertir Firestore Timestamp en Date
const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

// Helper pour convertir Date en Firestore Timestamp
const toTimestamp = (date: Date | undefined): Timestamp | undefined => {
  if (!date) return undefined;
  return Timestamp.fromDate(date);
};

// ============ USERS ============

export const createUser = async (userId: string, userData: UserCreateInput): Promise<void> => {
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...userData,
    createdAt: Timestamp.now(),
    totalSpent: 0,
  });
};

export const getUser = async (userId: string): Promise<User | null> => {
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return null;
  
  const data = userSnap.data();
  return {
    id: userSnap.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt) || new Date(),
  } as User;
};

export const getUserByPhone = async (phoneNumber: string): Promise<User | null> => {
  const db = getFirebaseDb();
  const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneNumber), limit(1));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt) || new Date(),
  } as User;
};

export const updateUser = async (userId: string, userData: UserUpdateInput): Promise<void> => {
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, userData);
};

export const updateUserTotalSpent = async (userId: string, amount: number): Promise<void> => {
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    totalSpent: increment(amount),
  });
};

// ============ PRODUCTS ============

export const createProduct = async (productData: ProductCreateInput): Promise<string> => {
  const db = getFirebaseDb();
  const productRef = doc(collection(db, 'products'));
  await setDoc(productRef, {
    ...productData,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return productRef.id;
};

export const getProduct = async (productId: string): Promise<Product | null> => {
  const db = getFirebaseDb();
  const productRef = doc(db, 'products', productId);
  const productSnap = await getDoc(productRef);
  
  if (!productSnap.exists()) return null;
  
  const data = productSnap.data();
  return {
    id: productSnap.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt) || new Date(),
    updatedAt: convertTimestamp(data.updatedAt) || new Date(),
  } as Product;
};

export const getProducts = async (filters?: {
  category?: string;
  isActive?: boolean;
}): Promise<Product[]> => {
  const db = getFirebaseDb();
  const constraints: QueryConstraint[] = [];
  
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters?.isActive !== undefined) {
    constraints.push(where('isActive', '==', filters.isActive));
  }
  
  constraints.push(orderBy('name'));
  
  const q = query(collection(db, 'products'), ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt) || new Date(),
      updatedAt: convertTimestamp(data.updatedAt) || new Date(),
    } as Product;
  });
};

export const updateProduct = async (productId: string, productData: ProductUpdateInput): Promise<void> => {
  const db = getFirebaseDb();
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, {
    ...productData,
    updatedAt: Timestamp.now(),
  });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  const db = getFirebaseDb();
  const productRef = doc(db, 'products', productId);
  await deleteDoc(productRef);
};

// ============ STOCK ============

export const getStock = async (productId: string): Promise<Stock | null> => {
  const db = getFirebaseDb();
  const q = query(collection(db, 'stock'), where('productId', '==', productId), limit(1));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    lastUpdated: convertTimestamp(data.lastUpdated) || new Date(),
  } as Stock;
};

export const getAllStocks = async (): Promise<Stock[]> => {
  const db = getFirebaseDb();
  const q = query(collection(db, 'stock'), orderBy('productId'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      lastUpdated: convertTimestamp(data.lastUpdated) || new Date(),
    } as Stock;
  });
};

export const updateStock = async (
  productId: string,
  stockData: StockUpdateInput,
  userId: string
): Promise<void> => {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  
  // Récupérer le stock actuel
  const currentStock = await getStock(productId);
  const previousStock = currentStock?.quantity || 0;
  const newStock = stockData.quantity;
  
  // Mettre à jour ou créer le stock
  const stockRef = currentStock
    ? doc(db, 'stock', currentStock.id)
    : doc(collection(db, 'stock'));
  
  batch.set(stockRef, {
    productId,
    quantity: newStock,
    lastUpdated: Timestamp.now(),
    updatedBy: userId,
  }, { merge: true });
  
  // Créer un mouvement de stock
  const movementRef = doc(collection(db, 'stockMovements'));
  batch.set(movementRef, {
    productId,
    type: stockData.type,
    quantity: stockData.type === 'sale' ? -Math.abs(stockData.quantity) : Math.abs(stockData.quantity),
    previousStock,
    newStock,
    orderId: stockData.orderId || null,
    createdAt: Timestamp.now(),
    createdBy: userId,
  });
  
  await batch.commit();
};

export const getStockMovements = async (productId?: string): Promise<StockMovement[]> => {
  const db = getFirebaseDb();
  const constraints: QueryConstraint[] = [];
  
  if (productId) {
    constraints.push(where('productId', '==', productId));
  }
  
  constraints.push(orderBy('createdAt', 'desc'));
  
  const q = query(collection(db, 'stockMovements'), ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt) || new Date(),
    } as StockMovement;
  });
};

// ============ ORDERS ============

export const createOrder = async (
  orderData: OrderCreateInput,
  managerId: string
): Promise<string> => {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  
  // Calculer les totaux
  const items: OrderItem[] = orderData.items.map((item) => ({
    ...item,
    totalPrice: item.quantity * item.unitPrice,
  }));
  
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Créer la commande
  const orderRef = doc(collection(db, 'orders'));
  batch.set(orderRef, {
    clientId: orderData.clientId,
    items,
    totalAmount,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: Timestamp.now(),
    createdBy: managerId,
    tableNumber: orderData.tableNumber || null,
  });
  
  // Mettre à jour le stock pour les boissons
  for (const item of items) {
    const product = await getProduct(item.productId);
    if (product?.hasStock) {
      const currentStock = await getStock(item.productId);
      const currentQuantity = currentStock?.quantity || 0;
      
      if (currentQuantity < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }
      
      await updateStock(
        item.productId,
        {
          productId: item.productId,
          quantity: currentQuantity - item.quantity,
          type: 'sale',
          orderId: orderRef.id,
        },
        managerId
      );
    }
  }
  
  // Mettre à jour le total dépensé du client
  const clientRef = doc(db, 'users', orderData.clientId);
  batch.update(clientRef, {
    totalSpent: increment(totalAmount),
  });
  
  await batch.commit();
  return orderRef.id;
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  const db = getFirebaseDb();
  const orderRef = doc(db, 'orders', orderId);
  const orderSnap = await getDoc(orderRef);
  
  if (!orderSnap.exists()) return null;
  
  const data = orderSnap.data();
  return {
    id: orderSnap.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt) || new Date(),
    completedAt: convertTimestamp(data.completedAt),
  } as Order;
};

export const getOrders = async (filters?: {
  clientId?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<Order[]> => {
  const db = getFirebaseDb();
  const constraints: QueryConstraint[] = [];
  
  if (filters?.clientId) {
    constraints.push(where('clientId', '==', filters.clientId));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.paymentStatus) {
    constraints.push(where('paymentStatus', '==', filters.paymentStatus));
  }
  
  constraints.push(orderBy('createdAt', 'desc'));
  
  const q = query(collection(db, 'orders'), ...constraints);
  const querySnapshot = await getDocs(q);
  
  let orders = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt) || new Date(),
      completedAt: convertTimestamp(data.completedAt),
    } as Order;
  });
  
  // Filtrer par date si nécessaire
  if (filters?.startDate || filters?.endDate) {
    orders = orders.filter((order) => {
      const orderDate = order.createdAt;
      if (filters.startDate && orderDate < filters.startDate) return false;
      if (filters.endDate && orderDate > filters.endDate) return false;
      return true;
    });
  }
  
  return orders;
};

export const updateOrder = async (orderId: string, orderData: OrderUpdateInput): Promise<void> => {
  const db = getFirebaseDb();
  const orderRef = doc(db, 'orders', orderId);
  const updateData: any = { ...orderData };
  
  if (orderData.status === 'completed' && !updateData.completedAt) {
    updateData.completedAt = Timestamp.now();
  }
  
  await updateDoc(orderRef, updateData);
};

export const getClientOrders = async (clientId: string): Promise<Order[]> => {
  return getOrders({ clientId });
};
