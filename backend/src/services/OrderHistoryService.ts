// Service d'historique des commandes
// Gère l'historique complet des modifications de commandes

import Order from '../models/Order';
import User from '../models/User';
import { Op } from 'sequelize';

export interface OrderHistoryEntry {
  id: number;
  orderId: number;
  action: 'created' | 'updated' | 'status_changed' | 'payment_added' | 'cancelled' | 'completed';
  oldValues?: any;
  newValues?: any;
  reason?: string;
  createdBy: number;
  createdAt: Date;
}

export interface OrderHistoryFilter {
  orderId?: number;
  userId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class OrderHistoryService {
  /**
   * Enregistre une action dans l'historique d'une commande
   */
  static async addHistoryEntry(
    orderId: number,
    action: OrderHistoryEntry['action'],
    userId: number,
    newValues?: any,
    oldValues?: any,
    reason?: string
  ): Promise<OrderHistoryEntry> {
    try {
      // Pour l'instant, on utilise une table simple (à créer plus tard)
      // Pour le moment, on stocke dans les logs
      const historyEntry = {
        orderId,
        action,
        oldValues,
        newValues,
        reason,
        createdBy: userId,
        createdAt: new Date()
      };

      console.log(`[ORDER_HISTORY] ${action} for order ${orderId}:`, historyEntry);
      
      // TODO: Implémenter la sauvegarde en base de données
      // await OrderHistory.create(historyEntry);
      
      return historyEntry as OrderHistoryEntry;
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'historique:', error);
      throw new Error('Impossible d\'enregistrer l\'action dans l\'historique');
    }
  }

  /**
   * Récupère l'historique d'une commande
   */
  static async getOrderHistory(
    orderId: number,
    filter?: Partial<OrderHistoryFilter>
  ): Promise<OrderHistoryEntry[]> {
    try {
      // TODO: Implémenter la récupération depuis la base de données
      // const whereClause: any = { orderId };
      
      // if (filter?.action) {
      //   whereClause.action = filter.action;
      // }
      
      // if (filter?.startDate) {
      //   whereClause.createdAt = { [Op.gte]: filter.startDate };
      // }
      
      // if (filter?.endDate) {
      //   whereClause.createdAt = { ...whereClause.createdAt, [Op.lte]: filter.endDate };
      // }
      
      // const history = await OrderHistory.findAll({
      //   where: whereClause,
      //   include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      //   order: [['createdAt', 'DESC']],
      //   limit: filter?.limit || 100,
      //   offset: filter?.offset || 0
      // });

      // Pour le moment, on retourne un historique vide
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw new Error('Impossible de récupérer l\'historique de la commande');
    }
  }

  /**
   * Récupère l'historique de toutes les commandes (pour les managers)
   */
  static async getAllOrdersHistory(
    filter: OrderHistoryFilter
  ): Promise<{
    entries: OrderHistoryEntry[];
    total: number;
  }> {
    try {
      // TODO: Implémenter la récupération depuis la base de données
      return {
        entries: [],
        total: 0
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique global:', error);
      throw new Error('Impossible de récupérer l\'historique des commandes');
    }
  }

  /**
   * Enregistre la création d'une commande
   */
  static async logOrderCreation(
    orderId: number,
    orderData: any,
    userId: number
  ): Promise<void> {
    await this.addHistoryEntry(
      orderId,
      'created',
      userId,
      orderData,
      undefined,
      'Commande créée'
    );
  }

  /**
   * Enregistre la mise à jour d'une commande
   */
  static async logOrderUpdate(
    orderId: number,
    oldValues: any,
    newValues: any,
    userId: number,
    reason?: string
  ): Promise<void> {
    await this.addHistoryEntry(
      orderId,
      'updated',
      userId,
      newValues,
      oldValues,
      reason || 'Commande mise à jour'
    );
  }

  /**
   * Enregistre le changement de statut d'une commande
   */
  static async logStatusChange(
    orderId: number,
    oldStatus: string,
    newStatus: string,
    userId: number,
    reason?: string
  ): Promise<void> {
    await this.addHistoryEntry(
      orderId,
      'status_changed',
      userId,
      { status: newStatus },
      { status: oldStatus },
      reason || `Changement de statut: ${oldStatus} → ${newStatus}`
    );
  }

  /**
   * Enregistre l'ajout d'un paiement
   */
  static async logPaymentAdded(
    orderId: number,
    paymentData: any,
    userId: number
  ): Promise<void> {
    await this.addHistoryEntry(
      orderId,
      'payment_added',
      userId,
      paymentData,
      undefined,
      `Paiement de ${paymentData.amount} FCFA ajouté`
    );
  }

  /**
   * Enregistre l'annulation d'une commande
   */
  static async logOrderCancellation(
    orderId: number,
    orderData: any,
    userId: number,
    reason?: string
  ): Promise<void> {
    await this.addHistoryEntry(
      orderId,
      'cancelled',
      userId,
      { status: 'cancelled', ...orderData },
      { status: orderData.status },
      reason || 'Commande annulée'
    );
  }

  /**
   * Enregistre la complétion d'une commande
   */
  static async logOrderCompletion(
    orderId: number,
    orderData: any,
    userId: number
  ): Promise<void> {
    await this.addHistoryEntry(
      orderId,
      'completed',
      userId,
      { status: 'completed', completedAt: new Date(), ...orderData },
      { status: orderData.status },
      'Commande complétée'
    );
  }

  /**
   * Formate les entrées d'historique pour l'affichage
   */
  static formatHistoryForDisplay(
    entries: OrderHistoryEntry[]
  ): Array<{
    id: number;
    action: string;
    actionLabel: string;
    oldValues?: any;
    newValues?: any;
    reason?: string;
    createdBy: number;
    createdAt: Date;
    formattedDate: string;
    changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }>;
  }> {
    return entries.map(entry => ({
      ...entry,
      actionLabel: this.getActionLabel(entry.action),
      formattedDate: entry.createdAt.toLocaleString('fr-FR'),
      changes: this.extractChanges(entry.oldValues, entry.newValues)
    }));
  }

  /**
   * Retourne le libellé d'une action
   */
  private static getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      created: 'Commande créée',
      updated: 'Commande mise à jour',
      status_changed: 'Statut modifié',
      payment_added: 'Paiement ajouté',
      cancelled: 'Commande annulée',
      completed: 'Commande complétée'
    };
    
    return labels[action] || action;
  }

  /**
   * Extrait les changements entre oldValues et newValues
   */
  private static extractChanges(oldValues?: any, newValues?: any): Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }> {
    if (!oldValues || !newValues) {
      return [];
    }

    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        changes.push({
          field: key,
          oldValue: oldValues[key],
          newValue: newValues[key]
        });
      }
    }

    return changes;
  }

  /**
   * Vérifie si une commande a des modifications récentes
   */
  static async hasRecentModifications(
    orderId: number,
    minutes: number = 30
  ): Promise<boolean> {
    try {
      const cutoffDate = new Date(Date.now() - minutes * 60 * 1000);
      
      // TODO: Implémenter la vérification en base de données
      // const recentEntry = await OrderHistory.findOne({
      //   where: {
      //     orderId,
      //     createdAt: { [Op.gte]: cutoffDate }
      //   }
      // });
      
      // return recentEntry !== null;
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification des modifications récentes:', error);
      return false;
    }
  }
}
