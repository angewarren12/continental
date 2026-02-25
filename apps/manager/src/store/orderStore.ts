import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Order, OrderItem } from '@shared/types/order';
import { User } from '@shared/types/user';
import { Product } from '@shared/types/product';

// Types pour le store
interface OrderState {
  // État des commandes
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  
  // État du builder
  builderStep: 'products' | 'client' | 'payment' | 'review';
  selectedProducts: OrderItem[];
  selectedClient: User | null;
  orderNotes: string;
  tableNumber: string;
  
  // État des suppléments
  availableSupplements: Product[];
  selectedSupplements: Array<{
    id: number;
    productId: number;
    name: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    parentItemIndex?: number;
  }>;
  
  // État de l'UI
  viewMode: 'list' | 'create' | 'edit' | 'history';
  searchQuery: string;
  filterStatus: string | null;
  filterClient: string | null;
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

interface OrderActions {
  // Actions sur les commandes
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: number, updates: Partial<Order>) => void;
  deleteOrder: (orderId: number) => void;
  setCurrentOrder: (order: Order | null) => void;
  clearCurrentOrder: () => void;
  
  // Actions de chargement
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Actions du builder
  setBuilderStep: (step: OrderState['builderStep']) => void;
  nextBuilderStep: () => void;
  previousBuilderStep: () => void;
  resetBuilder: () => void;
  
  // Actions sur les produits
  addProduct: (product: Product, quantity?: number) => void;
  updateProductQuantity: (index: number, quantity: number) => void;
  removeProduct: (index: number) => void;
  clearProducts: () => void;
  
  // Actions sur le client
  setSelectedClient: (client: User | null) => void;
  clearClient: () => void;
  
  // Actions sur les métadonnées
  setOrderNotes: (notes: string) => void;
  setTableNumber: (tableNumber: string) => void;
  
  // Actions sur les suppléments
  setAvailableSupplements: (supplements: Product[]) => void;
  addSupplement: (supplement: OrderState['selectedSupplements'][0]) => void;
  updateSupplementQuantity: (supplementId: number, quantity: number) => void;
  removeSupplement: (supplementId: number) => void;
  clearSupplements: () => void;
  
  // Actions de l'UI
  setViewMode: (mode: OrderState['viewMode']) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: string | null) => void;
  setFilterClient: (clientId: string | null) => void;
  clearFilters: () => void;
  
  // Actions de pagination
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  setTotalItems: (total: number) => void;
  
  // Actions utilitaires
  calculateOrderTotal: () => number;
  validateOrder: () => { isValid: boolean; errors: string[] };
  resetAll: () => void;
}

// Store Zustand
export const useOrderStore = create<OrderState & OrderActions>()(
  devtools(
    (set, get) => ({
      // État initial
      orders: [],
      currentOrder: null,
      loading: false,
      error: null,
      
      builderStep: 'products',
      selectedProducts: [],
      selectedClient: null,
      orderNotes: '',
      tableNumber: '',
      
      availableSupplements: [],
      selectedSupplements: [],
      
      viewMode: 'list',
      searchQuery: '',
      filterStatus: null,
      filterClient: null,
      
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,

      // Actions sur les commandes
      setOrders: (orders) => set({ orders }),
      
      addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders],
        totalItems: state.totalItems + 1,
      })),
      
      updateOrder: (orderId, updates) => set((state) => ({
        orders: state.orders.map(order =>
          order.id === orderId ? { ...order, ...updates } : order
        ),
        currentOrder: state.currentOrder?.id === orderId 
          ? { ...state.currentOrder, ...updates } 
          : state.currentOrder,
      })),
      
      deleteOrder: (orderId) => set((state) => ({
        orders: state.orders.filter(order => order.id !== orderId),
        currentOrder: state.currentOrder?.id === orderId ? null : state.currentOrder,
        totalItems: Math.max(0, state.totalItems - 1),
      })),
      
      setCurrentOrder: (order) => set({ currentOrder: order }),
      
      clearCurrentOrder: () => set({ currentOrder: null }),

      // Actions de chargement
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      // Actions du builder
      setBuilderStep: (step) => set({ builderStep: step }),
      
      nextBuilderStep: () => {
        const steps: OrderState['builderStep'][] = ['products', 'client', 'payment', 'review'];
        const currentStep = get().builderStep;
        const currentIndex = steps.indexOf(currentStep);
        
        if (currentIndex < steps.length - 1) {
          set({ builderStep: steps[currentIndex + 1] });
        }
      },
      
      previousBuilderStep: () => {
        const steps: OrderState['builderStep'][] = ['products', 'client', 'payment', 'review'];
        const currentStep = get().builderStep;
        const currentIndex = steps.indexOf(currentStep);
        
        if (currentIndex > 0) {
          set({ builderStep: steps[currentIndex - 1] });
        }
      },
      
      resetBuilder: () => set({
        builderStep: 'products',
        selectedProducts: [],
        selectedClient: null,
        orderNotes: '',
        tableNumber: '',
        selectedSupplements: [],
      }),

      // Actions sur les produits
      addProduct: (product, quantity = 1) => {
        const newItem: OrderItem = {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
          isSupplement: false,
        };
        
        set((state) => ({
          selectedProducts: [...state.selectedProducts, newItem],
        }));
      },
      
      updateProductQuantity: (index, quantity) => {
        if (quantity < 1) return;
        
        set((state) => {
          const updatedProducts = [...state.selectedProducts];
          updatedProducts[index] = {
            ...updatedProducts[index],
            quantity,
            totalPrice: quantity * updatedProducts[index].unitPrice,
          };
          
          return { selectedProducts: updatedProducts };
        });
      },
      
      removeProduct: (index) => set((state) => ({
        selectedProducts: state.selectedProducts.filter((_, i) => i !== index),
      })),
      
      clearProducts: () => set({ selectedProducts: [] }),

      // Actions sur le client
      setSelectedClient: (client) => set({ selectedClient: client }),
      
      clearClient: () => set({ selectedClient: null }),

      // Actions sur les métadonnées
      setOrderNotes: (notes) => set({ orderNotes: notes }),
      
      setTableNumber: (tableNumber) => set({ tableNumber }),

      // Actions sur les suppléments
      setAvailableSupplements: (supplements) => set({ availableSupplements: supplements }),
      
      addSupplement: (supplement) => set((state) => ({
        selectedSupplements: [...state.selectedSupplements, supplement],
      })),
      
      updateSupplementQuantity: (supplementId, quantity) => {
        if (quantity < 1) return;
        
        set((state) => {
          const updatedSupplements = state.selectedSupplements.map(supplement =>
            supplement.id === supplementId
              ? { ...supplement, quantity, totalPrice: quantity * supplement.unitPrice }
              : supplement
          );
          
          return { selectedSupplements: updatedSupplements };
        });
      },
      
      removeSupplement: (supplementId) => set((state) => ({
        selectedSupplements: state.selectedSupplements.filter(supplement => supplement.id !== supplementId),
      })),
      
      clearSupplements: () => set({ selectedSupplements: [] }),

      // Actions de l'UI
      setViewMode: (mode) => set({ viewMode: mode }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setFilterStatus: (status) => set({ filterStatus: status }),
      
      setFilterClient: (clientId) => set({ filterClient: clientId }),
      
      clearFilters: () => set({
        searchQuery: '',
        filterStatus: null,
        filterClient: null,
        currentPage: 1,
      }),

      // Actions de pagination
      setCurrentPage: (page) => set({ currentPage: page }),
      
      setItemsPerPage: (itemsPerPage) => set({ itemsPerPage }),
      
      setTotalItems: (total) => set({ totalItems: total }),

      // Actions utilitaires
      calculateOrderTotal: () => {
        const state = get();
        const productsTotal = state.selectedProducts.reduce(
          (total, product) => total + (product.totalPrice || (product.quantity * product.unitPrice)),
          0
        );
        const supplementsTotal = state.selectedSupplements.reduce(
          (total, supplement) => total + supplement.totalPrice,
          0
        );
        
        return productsTotal + supplementsTotal;
      },
      
      validateOrder: () => {
        const state = get();
        const errors: string[] = [];
        
        if (state.selectedProducts.length === 0) {
          errors.push('Veuillez ajouter au moins un produit');
        }
        
        if (!state.selectedClient) {
          errors.push('Veuillez sélectionner un client');
        }
        
        if (state.selectedProducts.some(product => product.quantity < 1)) {
          errors.push('Tous les produits doivent avoir une quantité positive');
        }
        
        if (state.selectedSupplements.some(supplement => supplement.quantity < 1)) {
          errors.push('Tous les suppléments doivent avoir une quantité positive');
        }
        
        return {
          isValid: errors.length === 0,
          errors,
        };
      },
      
      resetAll: () => set({
        orders: [],
        currentOrder: null,
        loading: false,
        error: null,
        builderStep: 'products',
        selectedProducts: [],
        selectedClient: null,
        orderNotes: '',
        tableNumber: '',
        availableSupplements: [],
        selectedSupplements: [],
        viewMode: 'list',
        searchQuery: '',
        filterStatus: null,
        filterClient: null,
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
      }),
    }),
    {
      name: 'order-store',
    }
  )
);

// Hooks sélectifs pour optimiser les performances
export const useOrders = () => useOrderStore((state) => state.orders);
export const useCurrentOrder = () => useOrderStore((state) => state.currentOrder);
export const useOrderLoading = () => useOrderStore((state) => state.loading);
export const useOrderError = () => useOrderStore((state) => state.error);
export const useBuilderState = () => useOrderStore((state) => ({
  step: state.builderStep,
  products: state.selectedProducts,
  client: state.selectedClient,
  notes: state.orderNotes,
  tableNumber: state.tableNumber,
  supplements: state.selectedSupplements,
}));
export const useOrderUI = () => useOrderStore((state) => ({
  viewMode: state.viewMode,
  searchQuery: state.searchQuery,
  filterStatus: state.filterStatus,
  filterClient: state.filterClient,
  currentPage: state.currentPage,
  itemsPerPage: state.itemsPerPage,
  totalItems: state.totalItems,
}));

export default useOrderStore;
