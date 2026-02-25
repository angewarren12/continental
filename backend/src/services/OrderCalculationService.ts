// Service de calcul unifié pour les commandes
// Centralise toute la logique de calcul des prix avec suppléments

import OrderItem from '../models/OrderItem';
import OrderSupplement from '../models/OrderSupplement';
import Product from '../models/Product';

export interface OrderCalculationInput {
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
    isSupplement?: boolean;
    parentItemId?: number;
  }>;
  supplements?: Array<{
    productId: number;
    supplementName: string;
    quantity: number;
    unitPrice: number;
    parentItemIndex?: number;
  }>;
}

export interface OrderCalculationResult {
  totalAmount: number;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
    isSupplement?: boolean;
    parentItemId?: number;
    supplements: Array<{
      supplementId: number;
      supplementName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  }>;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export class OrderCalculationService {
  /**
   * Calcule le prix total d'un item avec ses suppléments
   * Formule: (prixUnitaire + prixSupplémentsUnitaire) × quantité
   */
  static calculateItemTotalPrice(
    unitPrice: number,
    quantity: number,
    supplementsTotal: number
  ): number {
    return (unitPrice + supplementsTotal) * quantity;
  }

  /**
   * Calcule le prix des suppléments pour une unité
   */
  static calculateSupplementsPerUnit(supplements: Array<{ unitPrice: number; quantity: number }>): number {
    return supplements.reduce((total, supplement) => total + supplement.unitPrice, 0);
  }

  /**
   * Calcule le prix total des suppléments
   */
  static calculateSupplementsTotal(supplements: Array<{ unitPrice: number; quantity: number }>): number {
    return supplements.reduce((total, supplement) => total + (supplement.unitPrice * supplement.quantity), 0);
  }

  /**
   * Valide les données de calcul
   */
  static validateCalculationData(data: OrderCalculationInput): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation des items
    if (!data.items || data.items.length === 0) {
      errors.push('La commande doit contenir au moins un article');
    }

    data.items.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push(`L'article ${index + 1} doit avoir une quantité positive`);
      }
      if (item.unitPrice < 0) {
        errors.push(`L'article ${index + 1} doit avoir un prix unitaire positif`);
      }
    });

    // Validation des suppléments
    if (data.supplements) {
      data.supplements.forEach((supplement, index) => {
        if (supplement.quantity <= 0) {
          errors.push(`Le supplément ${index + 1} doit avoir une quantité positive`);
        }
        if (supplement.unitPrice < 0) {
          errors.push(`Le supplément ${index + 1} doit avoir un prix positif`);
        }
      });
    }

    // Avertissements
    data.items.forEach((item) => {
      if (item.quantity > 100) {
        warnings.push(`Quantité élevée pour l'article: ${item.productName}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calcule le montant total d'une commande avec validation complète
   */
  static calculateOrderTotal(data: OrderCalculationInput): OrderCalculationResult {
    // Validation des données
    const validation = this.validateCalculationData(data);

    if (!validation.isValid) {
      return {
        totalAmount: 0,
        items: [],
        validation
      };
    }

    const processedItems = data.items.map(item => {
      // Récupérer les suppléments associés à cet item
      const itemSupplements = (data.supplements || [])
        .filter(supplement => supplement.parentItemIndex === data.items.indexOf(item))
        .map(supplement => ({
          supplementId: supplement.productId,
          supplementName: supplement.supplementName,
          quantity: supplement.quantity,
          unitPrice: supplement.unitPrice,
          totalPrice: supplement.unitPrice * supplement.quantity
        }));

      // Calculer le prix des suppléments pour une unité
      const supplementsPerUnit = this.calculateSupplementsPerUnit(itemSupplements);
      
      // Calculer le prix total de l'item
      const totalPrice = this.calculateItemTotalPrice(
        item.unitPrice,
        item.quantity,
        supplementsPerUnit
      );

      return {
        ...item,
        totalPrice,
        supplements: itemSupplements
      };
    });

    // Calculer le montant total de la commande
    const totalAmount = processedItems.reduce((total, item) => total + item.totalPrice, 0);

    return {
      totalAmount,
      items: processedItems,
      validation
    };
  }

  /**
   * Simule le calcul pour validation avant sauvegarde
   */
  static simulateOrderCalculation(data: OrderCalculationInput): {
    estimatedTotal: number;
    breakdown: Array<{
      itemName: string;
      unitPrice: number;
      quantity: number;
      supplementsTotal: number;
      itemTotal: number;
    }>;
    validation: ReturnType<typeof OrderCalculationService.validateCalculationData>;
  } {
    const validation = this.validateCalculationData(data);
    
    if (!validation.isValid) {
      return {
        estimatedTotal: 0,
        breakdown: [],
        validation
      };
    }

    const breakdown = data.items.map(item => {
      const itemSupplements = (data.supplements || [])
        .filter(supplement => supplement.parentItemIndex === data.items.indexOf(item));
      
      const supplementsTotal = this.calculateSupplementsTotal(itemSupplements);
      const itemTotal = this.calculateItemTotalPrice(
        item.unitPrice,
        item.quantity,
        this.calculateSupplementsPerUnit(itemSupplements)
      );

      return {
        itemName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        supplementsTotal,
        itemTotal
      };
    });

    const estimatedTotal = breakdown.reduce((total, item) => total + item.itemTotal, 0);

    return {
      estimatedTotal,
      breakdown,
      validation
    };
  }
}
