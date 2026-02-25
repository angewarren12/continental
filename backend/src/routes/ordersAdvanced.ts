// Routes API pour la gestion avancée des commandes
// Implémentation des nouvelles fonctionnalités selon le plan de refonte

import { Router, Response } from 'express';
import { z } from 'zod';
import { Transaction } from 'sequelize';
import sequelize from '../config/database';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import OrderSupplement from '../models/OrderSupplement';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth';
import { OrderCalculationService } from '../services/OrderCalculationService';
import { OrderValidationService } from '../services/OrderValidationService';
import { SupplementService } from '../services/SupplementService';
import { OrderHistoryService } from '../services/OrderHistoryService';

const router = Router();
router.use(authenticate);

// Schémas de validation pour les nouvelles routes
const orderItemsSchema = z.array(z.object({
  productId: z.number().int().positive(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive().optional(),
  isSupplement: z.boolean().optional(),
  parentItemId: z.number().int().positive().optional(),
}));

const supplementsSchema = z.array(z.object({
  supplementId: z.number().int().positive(),
  supplementName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  parentItemIndex: z.number().int().optional(),
}));

const orderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled']),
  reason: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['cash', 'wave']),
  reason: z.string().optional(),
});

/**
 * Calcule le montant total d'une commande (simulation)
 * POST /api/orders/calculate
 */
router.post('/calculate', async (req: AuthRequest, res: Response) => {
  try {
    const { items, supplements } = req.body;

    const calculationResult = OrderCalculationService.simulateOrderCalculation({
      items,
      supplements
    });

    if (!calculationResult.validation.isValid) {
      return res.status(400).json({
        error: 'Données de calcul invalides',
        details: calculationResult.validation.errors
      });
    }

    res.json({
      success: true,
      data: {
        estimatedTotal: calculationResult.estimatedTotal,
        breakdown: calculationResult.breakdown,
        warnings: calculationResult.validation.warnings
      }
    });
  } catch (error) {
    console.error('[POST /orders/calculate] Error:', error);
    res.status(500).json({ error: 'Erreur lors du calcul de la commande' });
  }
});

/**
 * Ajoute des items à une commande existante
 * POST /api/orders/:id/items
 */
router.post('/:id/items', requireManager, async (req: AuthRequest, res: Response) => {
  const transaction: Transaction = await sequelize.transaction();
  
  try {
    const orderId = parseInt(req.params.id);
    const { items, supplements } = req.body;

    // Validation des données
    const itemsValidation = orderItemsSchema.safeParse(items);
    const supplementsValidation = supplementsSchema.safeParse(supplements || []);

    if (!itemsValidation.success || !supplementsValidation.success) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Données invalides',
        details: [...(itemsValidation.error?.errors || []), ...(supplementsValidation.error?.errors || [])]
      });
    }

    // Vérifier que la commande existe et peut être modifiée
    const order = await Order.findByPk(orderId);
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.status === 'completed' || order.paymentStatus === 'paid') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Impossible de modifier une commande complétée ou payée' });
    }

    // Créer les nouveaux items
    const newItems = await OrderItem.bulkCreate(
      itemsValidation.data.map(item => ({
        orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice || (item.quantity * item.unitPrice),
        isSupplement: item.isSupplement || false,
        parentItemId: item.parentItemId,
      })),
      { transaction, returning: true }
    );

    // Créer les suppléments
    if (supplementsValidation.data && supplementsValidation.data.length > 0) {
      await SupplementService.createOrderSupplements(
        orderId,
        itemsValidation.data,
        supplementsValidation.data,
        transaction
      );
    }

    // Recalculer le total de la commande
    const allItems = await OrderItem.findAll({
      where: { orderId },
      include: [
        {
          model: OrderSupplement,
          as: 'orderSupplements',
          required: false
        }
      ]
    });

    const newTotal = allItems.reduce((sum: number, item: any) => {
      const supplementsTotal = (item.orderSupplements as any[])?.reduce((supSum: number, sup: any) => supSum + sup.totalPrice, 0) || 0;
      return sum + (item.totalPrice || (item.quantity * item.unitPrice)) + supplementsTotal;
    }, 0);

    // Mettre à jour le total de la commande
    await order.update({ totalAmount: newTotal }, { transaction });

    // Enregistrer dans l'historique
    await OrderHistoryService.logOrderUpdate(
      orderId,
      { totalAmount: order.totalAmount },
      { totalAmount: newTotal, itemsAdded: itemsValidation.data },
      req.user!.id,
      'Items ajoutés à la commande'
    );

    await transaction.commit();

    res.json({
      success: true,
      data: {
        items: newItems,
        newTotal,
        message: `${itemsValidation.data.length} item(s) ajouté(s) à la commande`
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('[POST /orders/:id/items] Error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout des items à la commande' });
  }
});

/**
 * Met à jour les suppléments d'une commande
 * PUT /api/orders/:id/supplements
 */
router.put('/:id/supplements', requireManager, async (req: AuthRequest, res: Response) => {
  const transaction: Transaction = await sequelize.transaction();
  
  try {
    const orderId = parseInt(req.params.id);
    const { supplements } = req.body;

    // Validation des données
    const supplementsValidation = supplementsSchema.safeParse(supplements);
    if (!supplementsValidation.success) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Données de suppléments invalides',
        details: supplementsValidation.error.errors
      });
    }

    // Vérifier que la commande existe
    const order = await Order.findByPk(orderId);
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Mettre à jour les suppléments
    const items = await OrderItem.findAll({ where: { orderId } });
    await SupplementService.updateOrderSupplements(
      orderId,
      items,
      supplementsValidation.data,
      transaction
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Suppléments mis à jour avec succès'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('[PUT /orders/:id/supplements] Error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des suppléments' });
  }
});

/**
 * Met à jour le statut d'une commande avec historique
 * PUT /api/orders/:id/status
 */
router.put('/:id/status', requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const statusValidation = orderStatusSchema.safeParse(req.body);

    if (!statusValidation.success) {
      return res.status(400).json({
        error: 'Données de statut invalides',
        details: statusValidation.error.errors
      });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const oldStatus = order.status;
    const { status, reason } = statusValidation.data;

    // Mettre à jour le statut
    await order.update({ 
      status,
      completedAt: status === 'completed' ? new Date() : order.completedAt
    });

    // Enregistrer dans l'historique
    await OrderHistoryService.logStatusChange(
      orderId,
      oldStatus,
      status,
      req.user!.id,
      reason
    );

    res.json({
      success: true,
      data: {
        oldStatus,
        newStatus: status,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('[PUT /orders/:id/status] Error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

/**
 * Récupère l'historique d'une commande
 * GET /api/orders/:id/history
 */
router.get('/:id/history', async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { limit = 50, offset = 0 } = req.query;

    // Vérifier que l'utilisateur a le droit de voir cette commande
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const isManager = req.user!.role === 'manager';
    const isOwner = order.clientId === req.user!.id;

    if (!isManager && !isOwner) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const history = await OrderHistoryService.getOrderHistory(orderId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    const formattedHistory = OrderHistoryService.formatHistoryForDisplay(history);

    res.json({
      success: true,
      data: {
        orderId,
        history: formattedHistory,
        total: history.length
      }
    });
  } catch (error) {
    console.error('[GET /orders/:id/history] Error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

/**
 * Duplique une commande existante
 * POST /api/orders/:id/duplicate
 */
router.post('/:id/duplicate', requireManager, async (req: AuthRequest, res: Response) => {
  const transaction: Transaction = await sequelize.transaction();
  
  try {
    const orderId = parseInt(req.params.id);
    const { tableNumber, clientId } = req.body;

    // Récupérer la commande originale
    const originalOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: OrderSupplement,
              as: 'orderSupplements'
            }
          ]
        }
      ]
    });

    if (!originalOrder) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Commande originale non trouvée' });
    }

    // Créer la nouvelle commande
    const newOrder = await Order.create({
      clientId: clientId || originalOrder.clientId,
      totalAmount: originalOrder.totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      tableNumber: tableNumber,
      createdBy: req.user!.id,
    }, { transaction });

    // Dupliquer les items
    const newItems = await OrderItem.bulkCreate(
      originalOrder.items!.map(item => ({
        orderId: newOrder.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        isSupplement: item.isSupplement,
        parentItemId: item.parentItemId,
      })),
      { transaction, returning: true }
    );

    // Dupliquer les suppléments
    for (const item of originalOrder.items!) {
      if ((item as any).orderSupplements && (item as any).orderSupplements.length > 0) {
        const itemIndex = originalOrder.items!.indexOf(item);
        const newItemIndex = newItems.findIndex(newItem => 
          newItem.productId === item.productId && 
          newItem.quantity === item.quantity
        );

        if (newItemIndex !== -1) {
          const supplementsData = (item as any).orderSupplements.map((sup: any) => ({
            supplementId: sup.supplementId,
            supplementName: sup.supplementName,
            quantity: sup.quantity,
            unitPrice: sup.unitPrice,
            parentItemIndex: newItemIndex
          }));

          await SupplementService.createOrderSupplements(
            newOrder.id,
            [newItems[newItemIndex]],
            supplementsData,
            transaction
          );
        }
      }
    }

    // Enregistrer dans l'historique
    await OrderHistoryService.logOrderCreation(
      newOrder.id,
      { duplicatedFrom: orderId },
      req.user!.id
    );

    await transaction.commit();

    res.json({
      success: true,
      data: {
        newOrder,
        message: 'Commande dupliquée avec succès'
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('[POST /orders/:id/duplicate] Error:', error);
    res.status(500).json({ error: 'Erreur lors de la duplication de la commande' });
  }
});

/**
 * Valide une commande avant création
 * POST /api/orders/validate
 */
router.post('/validate', async (req: AuthRequest, res: Response) => {
  try {
    const orderData = req.body;

    // Validation complète
    const validation = await OrderValidationService.validateCompleteOrder(orderData);

    res.json({
      success: validation.isValid,
      data: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        validatedData: validation.data
      }
    });
  } catch (error) {
    console.error('[POST /orders/validate] Error:', error);
    res.status(500).json({ error: 'Erreur lors de la validation de la commande' });
  }
});

export default router;
