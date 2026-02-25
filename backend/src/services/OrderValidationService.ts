// Service de validation des commandes
// Centralise toute la logique de validation des données de commande

import { z } from 'zod';
import { OrderCalculationInput } from './OrderCalculationService';
import Product from '../models/Product';
import Stock from '../models/Stock';
import User from '../models/User';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: any;
}

export interface OrderValidationInput {
  clientId: number;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
    isSupplement?: boolean;
    parentItemId?: number;
  }>;
  tableNumber?: string;
  paymentMethod?: 'cash' | 'wave';
}

export class OrderValidationService {
  /**
   * Schéma de validation pour la création de commande
   */
  private static orderCreationSchema = z.object({
    clientId: z.number().int().positive('L\'ID du client doit être positif'),
    items: z.array(z.object({
      productId: z.number().int().positive('L\'ID du produit doit être positif'),
      productName: z.string().min(1, 'Le nom du produit est requis'),
      quantity: z.number().int().positive('La quantité doit être positive'),
      unitPrice: z.number().positive('Le prix unitaire doit être positif'),
      totalPrice: z.number().positive('Le prix total doit être positif').optional(),
      isSupplement: z.boolean().optional(),
      parentItemId: z.number().int().positive().optional(),
    })).min(1, 'La commande doit contenir au moins un article'),
    tableNumber: z.string().max(50, 'Le numéro de table ne doit pas dépasser 50 caractères').optional(),
  });

  /**
   * Valide les données de base de la commande
   */
  static validateOrderData(data: OrderValidationInput): ValidationResult {
    try {
      const validatedData = this.orderCreationSchema.parse(data);
      
      return {
        isValid: true,
        errors: [],
        warnings: [],
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return {
          isValid: false,
          errors,
          warnings: []
        };
      }
      
      return {
        isValid: false,
        errors: ['Erreur de validation inconnue'],
        warnings: []
      };
    }
  }

  /**
   * Valide la disponibilité des produits en stock
   */
  static async validateStockAvailability(items: OrderValidationInput['items']): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const item of items) {
      if (item.isSupplement) continue; // Les suppléments ne sont pas gérés en stock

      try {
        const product = await Product.findByPk(item.productId);
        if (!product) {
          errors.push(`Produit non trouvé: ${item.productName}`);
          continue;
        }

        const stock = await Stock.findOne({
          where: { productId: item.productId }
        });

        if (!stock) {
          warnings.push(`Aucun stock trouvé pour: ${item.productName}`);
          continue;
        }

        // Validation selon le type de produit
        let availableQuantity = stock.quantity;
        
        if (product.productType === 'cigarette') {
          const packets = stock.quantityPackets || 0;
          const units = stock.quantityUnits || 0;
          availableQuantity = packets * (product.conversionFactor || 20) + units;
        } else if (product.productType === 'egg') {
          const plates = stock.quantityPlates || 0;
          const units = stock.quantityUnits || 0;
          availableQuantity = plates * (product.conversionFactor || 30) + units;
        }

        if (availableQuantity < item.quantity) {
          errors.push(`Stock insuffisant pour ${item.productName}: ${availableQuantity} disponible, ${item.quantity} demandé`);
        }

        // Avertissement si stock bas
        if (availableQuantity <= item.quantity && availableQuantity > 0) {
          warnings.push(`Stock bas pour ${item.productName}: ${availableQuantity - item.quantity} restant`);
        }

      } catch (error) {
        errors.push(`Erreur de validation du stock pour ${item.productName}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valide l'existence du client
   */
  static async validateClient(clientId: number): Promise<ValidationResult> {
    try {
      const client = await User.findByPk(clientId);
      
      if (!client) {
        return {
          isValid: false,
          errors: ['Client non trouvé'],
          warnings: []
        };
      }

      if (client.role !== 'client') {
        return {
          isValid: false,
          errors: ['L\'utilisateur spécifié n\'est pas un client'],
          warnings: []
        };
      }

      return {
        isValid: true,
        errors: [],
        warnings: [],
        data: client
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Erreur lors de la validation du client'],
        warnings: []
      };
    }
  }

  /**
   * Valide la cohérence des prix
   */
  static validatePriceConsistency(items: OrderValidationInput['items']): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const item of items) {
      // Vérifier si le prix total correspond au calcul attendu
      if (item.totalPrice) {
        const expectedTotal = item.unitPrice * item.quantity;
        const tolerance = expectedTotal * 0.01; // Tolérance de 1%
        
        if (Math.abs(item.totalPrice - expectedTotal) > tolerance) {
          warnings.push(`Incohérence de prix pour ${item.productName}: attendu ${expectedTotal}, reçu ${item.totalPrice}`);
        }
      }

      // Vérifier les prix anormalement bas ou élevés
      if (item.unitPrice < 100) {
        warnings.push(`Prix unitaire très bas pour ${item.productName}: ${item.unitPrice} FCFA`);
      }
      
      if (item.unitPrice > 50000) {
        warnings.push(`Prix unitaire très élevé pour ${item.productName}: ${item.unitPrice} FCFA`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validation complète d'une commande
   */
  static async validateCompleteOrder(data: OrderValidationInput): Promise<ValidationResult> {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let validatedData: any = data;

    // 1. Validation des données de base
    const baseValidation = this.validateOrderData(data);
    if (!baseValidation.isValid) {
      allErrors.push(...baseValidation.errors);
    } else {
      validatedData = baseValidation.data;
    }
    allWarnings.push(...baseValidation.warnings);

    // 2. Validation du client
    const clientValidation = await this.validateClient(data.clientId);
    if (!clientValidation.isValid) {
      allErrors.push(...clientValidation.errors);
    }
    allWarnings.push(...clientValidation.warnings);

    // 3. Validation du stock
    const stockValidation = await this.validateStockAvailability(data.items);
    if (!stockValidation.isValid) {
      allErrors.push(...stockValidation.errors);
    }
    allWarnings.push(...stockValidation.warnings);

    // 4. Validation de la cohérence des prix
    const priceValidation = this.validatePriceConsistency(data.items);
    allErrors.push(...priceValidation.errors);
    allWarnings.push(...priceValidation.warnings);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      data: validatedData
    };
  }

  /**
   * Validation pour la modification d'une commande existante
   */
  static async validateOrderUpdate(
    orderId: number,
    updates: Partial<OrderValidationInput>,
    currentOrder?: any
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Si la commande est déjà complétée, on ne peut plus la modifier
    if (currentOrder && currentOrder.status === 'completed') {
      errors.push('Impossible de modifier une commande déjà complétée');
    }

    // Si la commande est déjà payée, on ne peut plus modifier les items
    if (currentOrder && currentOrder.paymentStatus === 'paid') {
      errors.push('Impossible de modifier les items d\'une commande déjà payée');
    }

    // Validation des mises à jour spécifiques
    if (updates.tableNumber && updates.tableNumber.length > 50) {
      errors.push('Le numéro de table ne doit pas dépasser 50 caractères');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
