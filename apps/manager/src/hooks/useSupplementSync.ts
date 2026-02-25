import { useState, useCallback, useEffect } from 'react';
import { OrderItem } from '@shared/types/order';
import { supplementSyncService, SupplementSyncRule, QuantityUpdateResult } from '../services/SupplementSyncService';

export interface UseSupplementSyncOptions {
  autoSync?: boolean;
  syncRatio?: number;
  onSyncUpdate?: (result: QuantityUpdateResult) => void;
  onError?: (error: string) => void;
}

export interface UseSupplementSyncReturn {
  // État
  isSyncEnabled: boolean;
  syncRules: SupplementSyncRule[];
  isProcessing: boolean;
  lastUpdateResult: QuantityUpdateResult | null;

  // Actions
  toggleSync: (enabled: boolean) => void;
  updateQuantity: (item: OrderItem, newQuantity: number, supplements: any[]) => Promise<QuantityUpdateResult>;
  setSyncRatio: (ratio: number) => void;
  addSyncRule: (rule: SupplementSyncRule) => void;
  removeSyncRule: (supplementId: number) => void;

  // Utilitaires
  calculateItemTotal: (item: OrderItem, supplements: any[]) => number;
  hasSyncedSupplements: (itemId: number) => boolean;
}

/**
 * Hook personnalisé pour gérer la synchronisation des quantités entre produits et suppléments
 */
export const useSupplementSync = (
  itemId: number,
  supplementIds: number[] = [],
  options: UseSupplementSyncOptions = {}
): UseSupplementSyncReturn => {
  const {
    autoSync = true,
    syncRatio = 1,
    onSyncUpdate,
    onError,
  } = options;

  // État local
  const [isSyncEnabled, setIsSyncEnabled] = useState(autoSync);
  const [currentSyncRatio, setCurrentSyncRatio] = useState(syncRatio);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdateResult, setLastUpdateResult] = useState<QuantityUpdateResult | null>(null);
  const [syncRules, setSyncRules] = useState<SupplementSyncRule[]>([]);

  // Initialiser les règles de synchronisation
  useEffect(() => {
    if (itemId && supplementIds.length > 0) {
      // Créer des règles par défaut si elles n'existent pas
      supplementSyncService.createDefaultSyncRules(itemId, supplementIds);
      
      // Charger les règles existantes
      const rules = supplementSyncService.getSyncRules(itemId);
      setSyncRules(rules);
      
      // Mettre à jour l'état de synchronisation
      const hasEnabledRules = rules.some(rule => rule.syncEnabled);
      setIsSyncEnabled(hasEnabledRules);
    }
  }, [itemId, supplementIds]);

  // Activer/désactiver la synchronisation
  const toggleSync = useCallback((enabled: boolean) => {
    setIsSyncEnabled(enabled);
    
    // Mettre à jour toutes les règles pour cet item
    syncRules.forEach(rule => {
      if (rule.parentItemId === itemId) {
        supplementSyncService.toggleSync(itemId, rule.supplementId);
      }
    });
    
    // Recharger les règles
    const updatedRules = supplementSyncService.getSyncRules(itemId);
    setSyncRules(updatedRules);
  }, [itemId, syncRules]);

  // Mettre à jour la quantité avec synchronisation
  const updateQuantity = useCallback(async (
    item: OrderItem,
    newQuantity: number,
    supplements: any[]
  ): Promise<QuantityUpdateResult> => {
    if (newQuantity < 1) {
      const error = 'La quantité doit être supérieure à 0';
      onError?.(error);
      return {
        success: false,
        updatedItems: [],
        updatedSupplements: [],
        error,
      };
    }

    setIsProcessing(true);

    try {
      let result: QuantityUpdateResult;

      if (isSyncEnabled) {
        // Utiliser le service de synchronisation
        result = supplementSyncService.updateSupplementQuantities(item, newQuantity, supplements);
      } else {
        // Mise à jour simple sans synchronisation
        result = {
          success: true,
          updatedItems: [{
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice,
          }],
          updatedSupplements: supplements, // Garder les suppléments tels quels
        };
      }

      setLastUpdateResult(result);
      onSyncUpdate?.(result);

      if (!result.success && result.error) {
        onError?.(result.error);
      }

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la mise à jour';
      const errorResult: QuantityUpdateResult = {
        success: false,
        updatedItems: [],
        updatedSupplements: [],
        error: errorMessage,
      };
      
      setLastUpdateResult(errorResult);
      onError?.(errorMessage);
      
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, [isSyncEnabled, onSyncUpdate, onError]);

  // Définir le ratio de synchronisation
  const setSyncRatio = useCallback((ratio: number) => {
    setCurrentSyncRatio(ratio);
    
    // Mettre à jour toutes les règles avec le nouveau ratio
    syncRules.forEach(rule => {
      if (rule.parentItemId === itemId) {
        supplementSyncService.removeSyncRule(itemId, rule.supplementId);
        supplementSyncService.addSyncRule({
          ...rule,
          syncRatio: ratio,
        });
      }
    });
    
    // Recharger les règles
    const updatedRules = supplementSyncService.getSyncRules(itemId);
    setSyncRules(updatedRules);
  }, [itemId, syncRules]);

  // Ajouter une règle de synchronisation
  const addSyncRule = useCallback((rule: SupplementSyncRule) => {
    supplementSyncService.addSyncRule(rule);
    
    // Recharger les règles
    const updatedRules = supplementSyncService.getSyncRules(itemId);
    setSyncRules(updatedRules);
  }, [itemId]);

  // Supprimer une règle de synchronisation
  const removeSyncRule = useCallback((supplementId: number) => {
    supplementSyncService.removeSyncRule(itemId, supplementId);
    
    // Recharger les règles
    const updatedRules = supplementSyncService.getSyncRules(itemId);
    setSyncRules(updatedRules);
  }, [itemId]);

  // Calculer le total d'un item avec ses suppléments
  const calculateItemTotal = useCallback((item: OrderItem, supplements: any[]): number => {
    return supplementSyncService.calculateItemTotal(item, supplements);
  }, []);

  // Vérifier si un item a des suppléments synchronisés
  const hasSyncedSupplements = useCallback((itemId: number): boolean => {
    return supplementSyncService.hasSyncedSupplements(itemId);
  }, []);

  return {
    // État
    isSyncEnabled,
    syncRules,
    isProcessing,
    lastUpdateResult,

    // Actions
    toggleSync,
    updateQuantity,
    setSyncRatio,
    addSyncRule,
    removeSyncRule,

    // Utilitaires
    calculateItemTotal,
    hasSyncedSupplements,
  };
};

/**
 * Hook pour gérer la synchronisation au niveau d'une commande entière
 */
export const useOrderSupplementSync = (orderItems: OrderItem[] = []) => {
  const [globalSyncEnabled, setGlobalSyncEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Appliquer la synchronisation à toute la commande
  const applyGlobalSync = useCallback(async (items: OrderItem[], supplements: any[]) => {
    setIsProcessing(true);

    try {
      const result = supplementSyncService.applySyncToOrder(items, supplements);
      
      return {
        success: true,
        updatedItems: result.updatedItems,
        updatedSupplements: result.updatedSupplements,
      };
    } catch (error: any) {
      return {
        success: false,
        updatedItems: [],
        updatedSupplements: [],
        error: error.message || 'Erreur lors de la synchronisation globale',
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Activer/désactiver la synchronisation globale
  const toggleGlobalSync = useCallback((enabled: boolean) => {
    setGlobalSyncEnabled(enabled);
    
    // Appliquer à tous les items
    orderItems.forEach(item => {
      const rules = supplementSyncService.getSyncRules(item.id || 0);
      rules.forEach(rule => {
        supplementSyncService.toggleSync(item.id || 0, rule.supplementId);
      });
    });
  }, [orderItems]);

  return {
    globalSyncEnabled,
    isProcessing,
    applyGlobalSync,
    toggleGlobalSync,
  };
};

export default useSupplementSync;
