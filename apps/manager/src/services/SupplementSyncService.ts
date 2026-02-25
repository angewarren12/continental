import { OrderItem } from '@shared/types/order';

export interface SupplementSyncRule {
  parentItemId: number;
  supplementId: number;
  syncRatio: number; // Ratio de synchronisation (1:1, 1:2, etc.)
  syncEnabled: boolean;
}

export interface QuantityUpdateResult {
  success: boolean;
  updatedItems: OrderItem[];
  updatedSupplements: any[];
  error?: string;
}

/**
 * Service pour gérer la synchronisation des quantités entre les produits et leurs suppléments
 */
export class SupplementSyncService {
  private syncRules: Map<number, SupplementSyncRule[]> = new Map();

  /**
   * Ajoute une règle de synchronisation
   */
  addSyncRule(rule: SupplementSyncRule): void {
    const existingRules = this.syncRules.get(rule.parentItemId) || [];
    existingRules.push(rule);
    this.syncRules.set(rule.parentItemId, existingRules);
  }

  /**
   * Supprime une règle de synchronisation
   */
  removeSyncRule(parentItemId: number, supplementId: number): void {
    const existingRules = this.syncRules.get(parentItemId) || [];
    const filteredRules = existingRules.filter(rule => rule.supplementId !== supplementId);
    this.syncRules.set(parentItemId, filteredRules);
  }

  /**
   * Active/désactive la synchronisation pour un supplément
   */
  toggleSync(parentItemId: number, supplementId: number): void {
    const existingRules = this.syncRules.get(parentItemId) || [];
    const rule = existingRules.find(r => r.supplementId === supplementId);
    
    if (rule) {
      rule.syncEnabled = !rule.syncEnabled;
    }
  }

  /**
   * Met à jour les quantités des suppléments en fonction de la quantité du produit parent
   */
  updateSupplementQuantities(
    parentItem: OrderItem,
    newQuantity: number,
    currentSupplements: any[]
  ): QuantityUpdateResult {
    try {
      const syncRules = this.syncRules.get(parentItem.id || 0) || [];
      const updatedSupplements: any[] = [];

      // Parcourir tous les suppléments actuels
      for (const supplement of currentSupplements) {
        const syncRule = syncRules.find(rule => rule.supplementId === supplement.id);
        
        if (syncRule && syncRule.syncEnabled) {
          // Calculer la nouvelle quantité du supplément
          const newSupplementQuantity = Math.round(newQuantity * syncRule.syncRatio);
          
          // Mettre à jour le supplément
          const updatedSupplement = {
            ...supplement,
            quantity: newSupplementQuantity,
            totalPrice: newSupplementQuantity * supplement.unitPrice,
          };
          
          updatedSupplements.push(updatedSupplement);
        } else {
          // Garder le supplément tel quel si pas de synchronisation
          updatedSupplements.push(supplement);
        }
      }

      // Mettre à jour le produit parent
      const updatedParentItem = {
        ...parentItem,
        quantity: newQuantity,
        totalPrice: newQuantity * parentItem.unitPrice,
      };

      return {
        success: true,
        updatedItems: [updatedParentItem],
        updatedSupplements,
      };
    } catch (error: any) {
      return {
        success: false,
        updatedItems: [],
        updatedSupplements: [],
        error: error.message || 'Erreur lors de la synchronisation des suppléments',
      };
    }
  }

  /**
   * Calcule le total d'un item avec ses suppléments
   */
  calculateItemTotal(item: OrderItem, supplements: any[]): number {
    const itemTotal = item.totalPrice || (item.quantity * item.unitPrice);
    const supplementsTotal = supplements.reduce((sum, sup) => sum + sup.totalPrice, 0);
    return itemTotal + supplementsTotal;
  }

  /**
   * Vérifie si un item a des suppléments synchronisés
   */
  hasSyncedSupplements(itemId: number): boolean {
    const syncRules = this.syncRules.get(itemId) || [];
    return syncRules.some(rule => rule.syncEnabled);
  }

  /**
   * Obtient les règles de synchronisation pour un item
   */
  getSyncRules(itemId: number): SupplementSyncRule[] {
    return this.syncRules.get(itemId) || [];
  }

  /**
   * Crée des règles de synchronisation par défaut pour un item
   */
  createDefaultSyncRules(parentItemId: number, supplementIds: number[]): void {
    supplementIds.forEach(supplementId => {
      this.addSyncRule({
        parentItemId,
        supplementId,
        syncRatio: 1, // Synchronisation 1:1 par défaut
        syncEnabled: true, // Activé par défaut
      });
    });
  }

  /**
   * Applique les règles de synchronisation à tous les items d'une commande
   */
  applySyncToOrder(items: OrderItem[], supplements: any[]): {
    updatedItems: OrderItem[];
    updatedSupplements: any[];
  } {
    const updatedItems: OrderItem[] = [...items];
    const updatedSupplements: any[] = [...supplements];

    // Pour chaque item, appliquer les règles de synchronisation
    items.forEach(item => {
      const syncRules = this.syncRules.get(item.id || 0) || [];
      
      syncRules.forEach(rule => {
        if (rule.syncEnabled) {
          const supplement = updatedSupplements.find(s => s.id === rule.supplementId);
          
          if (supplement) {
            // Mettre à jour la quantité du supplément
            supplement.quantity = Math.round(item.quantity * rule.syncRatio);
            supplement.totalPrice = supplement.quantity * supplement.unitPrice;
          }
        }
      });
    });

    return {
      updatedItems,
      updatedSupplements,
    };
  }

  /**
   * Réinitialise toutes les règles de synchronisation
   */
  resetAllSyncRules(): void {
    this.syncRules.clear();
  }

  /**
   * Exporte les règles de synchronisation
   */
  exportSyncRules(): SupplementSyncRule[] {
    const allRules: SupplementSyncRule[] = [];
    
    this.syncRules.forEach((rules) => {
      allRules.push(...rules);
    });
    
    return allRules;
  }

  /**
   * Importe des règles de synchronisation
   */
  importSyncRules(rules: SupplementSyncRule[]): void {
    this.resetAllSyncRules();
    
    rules.forEach(rule => {
      this.addSyncRule(rule);
    });
  }
}

// Instance singleton du service
export const supplementSyncService = new SupplementSyncService();

export default supplementSyncService;
