// Service de gestion des suppléments
// Centralise toute la logique de gestion des suppléments de commande

import OrderSupplement from '../models/OrderSupplement';
import OrderItem from '../models/OrderItem';
import Product from '../models/Product';
import { Op, Transaction } from 'sequelize';

export interface SupplementData {
  supplementId: number;
  supplementName: string;
  quantity: number;
  unitPrice: number;
  parentItemIndex?: number;
}

export interface SupplementCalculationResult {
  supplements: Array<{
    id: number;
    supplementId: number;
    supplementName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalPrice: number;
  validation: {
    isValid: boolean;
    errors: string[];
  };
}

export class SupplementService {
  /**
   * Crée les suppléments pour une commande
   */
  static async createOrderSupplements(
    orderId: number,
    items: Array<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      isSupplement?: boolean;
      parentItemId?: number;
    }>,
    supplementsData: SupplementData[],
    transaction: Transaction
  ): Promise<OrderSupplement[]> {
    const createdSupplements: OrderSupplement[] = [];

    // Pour chaque item principal, créer ses suppléments
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item = items[itemIndex];
      
      if (item.isSupplement) continue; // Ignorer les items qui sont déjà des suppléments

      // Récupérer les suppléments pour cet item
      const itemSupplements = supplementsData.filter(
        sup => sup.parentItemIndex === itemIndex
      );

      // Créer les suppléments dans la base de données
      for (const supplementData of itemSupplements) {
        try {
          const supplement = await OrderSupplement.create({
            orderId,
            orderItemId: 0, // Sera mis à jour après création de l'item principal
            supplementId: supplementData.supplementId,
            supplementName: supplementData.supplementName,
            quantity: supplementData.quantity,
            unitPrice: supplementData.unitPrice,
            totalPrice: supplementData.unitPrice * supplementData.quantity,
          }, { transaction });

          createdSupplements.push(supplement);
        } catch (error) {
          console.error(`Erreur lors de la création du supplément ${supplementData.supplementName}:`, error);
          throw new Error(`Impossible de créer le supplément ${supplementData.supplementName}`);
        }
      }
    }

    return createdSupplements;
  }

  /**
   * Calcule les suppléments pour un item
   */
  static calculateItemSupplements(
    supplementsData: SupplementData[],
    itemIndex: number
  ): SupplementCalculationResult {
    const itemSupplements = supplementsData.filter(sup => sup.parentItemIndex === itemIndex);
    const errors: string[] = [];

    // Validation des données de suppléments
    itemSupplements.forEach(supplement => {
      if (supplement.quantity <= 0) {
        errors.push(`La quantité du supplément ${supplement.supplementName} doit être positive`);
      }
      if (supplement.unitPrice < 0) {
        errors.push(`Le prix du supplément ${supplement.supplementName} doit être positif`);
      }
    });

    const supplements = itemSupplements.map(supplement => ({
      id: 0, // Sera mis à jour après création
      supplementId: supplement.supplementId,
      supplementName: supplement.supplementName,
      quantity: supplement.quantity,
      unitPrice: supplement.unitPrice,
      totalPrice: supplement.unitPrice * supplement.quantity,
    }));

    const totalPrice = supplements.reduce((total, sup) => total + sup.totalPrice, 0);

    return {
      supplements,
      totalPrice,
      validation: {
        isValid: errors.length === 0,
        errors
      }
    };
  }

  /**
   * Met à jour les suppléments d'une commande
   */
  static async updateOrderSupplements(
    orderId: number,
    items: any[],
    supplementsData: SupplementData[],
    transaction: Transaction
  ): Promise<void> {
    // 1. Supprimer les anciens suppléments
    await OrderSupplement.destroy({
      where: { orderId },
      transaction
    });

    // 2. Recréer les nouveaux suppléments
    await this.createOrderSupplements(orderId, items, supplementsData, transaction);
  }

  /**
   * Récupère les suppléments d'une commande
   */
  static async getOrderSupplements(orderId: number): Promise<OrderSupplement[]> {
    return await OrderSupplement.findAll({
      where: { orderId },
      include: [
        {
          model: Product,
          as: 'supplement',
          attributes: ['id', 'name', 'productType']
        }
      ],
      order: [['created_at', 'ASC']]
    });
  }

  /**
   * Récupère les suppléments pour un item spécifique
   */
  static async getItemSupplements(orderItemId: number): Promise<OrderSupplement[]> {
    return await OrderSupplement.findAll({
      where: { orderItemId },
      include: [
        {
          model: Product,
          as: 'supplement',
          attributes: ['id', 'name', 'productType']
        }
      ]
    });
  }

  /**
   * Valide les données de suppléments
   */
  static validateSupplementsData(supplementsData: SupplementData[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    supplementsData.forEach((supplement, index) => {
      if (!supplement.supplementId || supplement.supplementId <= 0) {
        errors.push(`Le supplément ${index + 1} doit avoir un ID valide`);
      }
      
      if (!supplement.supplementName || supplement.supplementName.trim().length === 0) {
        errors.push(`Le supplément ${index + 1} doit avoir un nom valide`);
      }
      
      if (supplement.quantity <= 0) {
        errors.push(`Le supplément ${index + 1} doit avoir une quantité positive`);
      }
      
      if (supplement.unitPrice < 0) {
        errors.push(`Le supplément ${index + 1} doit avoir un prix positif`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calcule le prix total des suppléments pour une commande
   */
  static calculateOrderSupplementsTotal(supplementsData: SupplementData[]): number {
    return supplementsData.reduce((total, supplement) => {
      return total + (supplement.unitPrice * supplement.quantity);
    }, 0);
  }

  /**
   * Formate les données des suppléments pour l'affichage
   */
  static formatSupplementsForDisplay(supplements: OrderSupplement[]): Array<{
    id: number;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productType?: string;
  }> {
    return supplements.map(supplement => ({
      id: supplement.id,
      name: supplement.supplementName,
      quantity: supplement.quantity,
      unitPrice: supplement.unitPrice,
      totalPrice: supplement.totalPrice,
      productType: supplement.supplement?.productType
    }));
  }

  /**
   * Vérifie la disponibilité des suppléments
   */
  static async checkSupplementsAvailability(
    supplementsData: SupplementData[]
  ): Promise<{
    isAvailable: boolean;
    unavailableSupplements: string[];
  }> {
    const unavailableSupplements: string[] = [];

    for (const supplementData of supplementsData) {
      try {
        const supplement = await Product.findByPk(supplementData.supplementId);
        
        if (!supplement) {
          unavailableSupplements.push(supplementData.supplementName);
          continue;
        }

        // Les suppléments sont généralement des produits "supplement"
        if (supplement.productType !== 'supplement') {
          unavailableSupplements.push(`${supplementData.supplementName} n'est pas un supplément valide`);
        }

      } catch (error) {
        unavailableSupplements.push(supplementData.supplementName);
      }
    }

    return {
      isAvailable: unavailableSupplements.length === 0,
      unavailableSupplements
    };
  }
}
