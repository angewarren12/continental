import { Router, Response } from 'express';
import { z } from 'zod';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Product from '../models/Product';
import Stock from '../models/Stock';
import StockMovement from '../models/StockMovement';
import User from '../models/User';
import Payment from '../models/Payment';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Schéma de validation
const createOrderSchema = z.object({
  clientId: z.number().int().positive(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    productName: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })),
  tableNumber: z.string().optional(),
});

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional(),
  paymentMethod: z.enum(['cash', 'wave']).optional(),
  tableNumber: z.string().optional().nullable(),
});

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['cash', 'wave']),
});

const addItemsToOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    productName: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })),
});

// Obtenir toutes les commandes
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    console.log('[GET /orders] User:', req.user?.id, 'Role:', req.user?.role);
    const isManager = req.user!.role === 'manager';
    const where: any = {};
    
    // Les clients ne voient que leurs propres commandes
    if (!isManager) {
      where.clientId = req.user!.id;
    }

    // Filtres optionnels
    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.paymentStatus) {
      where.paymentStatus = req.query.paymentStatus;
    }
    if (req.query.clientId && isManager) {
      where.clientId = parseInt(req.query.clientId as string);
    }

    console.log('[GET /orders] Where clause:', where);
    const orders = await Order.findAll({
      where,
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'phoneNumber'] },
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payments', order: [['created_at', 'DESC']] },
      ],
      order: [['created_at', 'DESC']],
    });

    console.log('[GET /orders] Found orders:', orders.length);
    res.json({ orders });
  } catch (error) {
    console.error('[GET /orders] Error:', error);
    if (error instanceof Error) {
      console.error('[GET /orders] Error message:', error.message);
      console.error('[GET /orders] Error stack:', error.stack);
    }
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des commandes',
      details: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Créer un paiement partiel (manager uniquement) - DOIT être AVANT /:id
router.post('/:id/payments', requireManager, async (req: AuthRequest, res: Response) => {
  const transaction: Transaction = await sequelize.transaction();
  
  try {
    const orderId = parseInt(req.params.id);
    console.log('[POST /orders/:id/payments] Order ID:', orderId);
    console.log('[POST /orders/:id/payments] Request body:', req.body);
    
    // Valider et parser les données (orderId vient de l'URL, pas du body)
    let validatedData;
    try {
      validatedData = createPaymentSchema.parse(req.body);
      console.log('[POST /orders/:id/payments] Validated data:', validatedData);
    } catch (validationError: any) {
      console.error('[POST /orders/:id/payments] Validation error:', validationError);
      await transaction.rollback();
      if (validationError instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Données invalides', 
          details: validationError.errors 
        });
        return;
      }
      throw validationError;
    }
    
    const order = await Order.findByPk(orderId, { transaction });
    if (!order) {
      await transaction.rollback();
      res.status(404).json({ error: 'Commande non trouvée' });
      return;
    }

    // Récupérer tous les paiements existants
    const existingPayments = await Payment.findAll({
      where: { orderId },
      transaction,
    });
    const totalPaid = existingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const orderTotal = Number(order.totalAmount);
    const remainingAmount = orderTotal - totalPaid;

    // Vérifier que le montant ne dépasse pas le reste à payer
    if (validatedData.amount > remainingAmount) {
      await transaction.rollback();
      res.status(400).json({ 
        error: `Montant trop élevé. Reste à payer: ${remainingAmount} FCFA` 
      });
      return;
    }

    // Si le montant est négatif ou nul, rejeter
    if (validatedData.amount <= 0) {
      await transaction.rollback();
      res.status(400).json({ 
        error: 'Le montant doit être supérieur à 0' 
      });
      return;
    }

    // Créer le paiement
    const payment = await Payment.create({
      orderId: orderId, // orderId vient de l'URL (req.params.id)
      amount: validatedData.amount,
      paymentMethod: validatedData.paymentMethod,
      createdBy: req.user!.id,
    }, { transaction });

    // Calculer le nouveau total payé
    const newTotalPaid = totalPaid + validatedData.amount;

    // Mettre à jour le statut de paiement de la commande
    let newPaymentStatus: 'pending' | 'paid' = 'pending';
    if (newTotalPaid >= orderTotal) {
      newPaymentStatus = 'paid';
    }

    await order.update(
      { 
        paymentStatus: newPaymentStatus,
        paymentMethod: validatedData.paymentMethod, // Dernière méthode utilisée
      },
      { transaction }
    );

    // Mettre à jour le total dépensé du client seulement si c'est le paiement complet
    if (newPaymentStatus === 'paid' && totalPaid < orderTotal) {
      const client = await User.findByPk(order.clientId, { transaction });
      if (client) {
        const amountToAdd = orderTotal - totalPaid;
        await client.increment('totalSpent', { by: amountToAdd, transaction });
      }
    }

    await transaction.commit();

    // Récupérer la commande avec tous les paiements
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'phoneNumber'] },
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payments', order: [['created_at', 'DESC']], include: [
          { model: User, as: 'creator', attributes: ['id', 'name'] },
        ]},
      ],
    });

    res.status(201).json({ payment, order: updatedOrder });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
});

// Ajouter des articles à une commande existante (manager uniquement) - DOIT être AVANT /:id
router.post('/:id/items', requireManager, async (req: AuthRequest, res: Response) => {
  const transaction: Transaction = await sequelize.transaction();
  
  try {
    const orderId = parseInt(req.params.id);
    const validatedData = addItemsToOrderSchema.parse(req.body);
    
    // Récupérer la commande
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction,
    });
    
    if (!order) {
      await transaction.rollback();
      res.status(404).json({ error: 'Commande non trouvée' });
      return;
    }

    // Vérifier que la commande n'est pas complétée ou annulée
    if (order.status === 'completed' || order.status === 'cancelled') {
      await transaction.rollback();
      res.status(400).json({ error: 'Impossible d\'ajouter des articles à une commande complétée ou annulée' });
      return;
    }

    // Vérifier que la commande n'est pas déjà payée
    // Récupérer tous les paiements existants pour vérifier le montant total payé
    const existingPayments = await Payment.findAll({
      where: { orderId },
      transaction,
    });
    const totalPaid = existingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const orderTotal = Number(order.totalAmount);
    
    if (totalPaid >= orderTotal && orderTotal > 0) {
      await transaction.rollback();
      res.status(400).json({ error: 'Impossible d\'ajouter des articles à une commande déjà payée' });
      return;
    }

    // Calculer le montant des nouveaux articles
    const newItemsAmount = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Créer les nouveaux items de commande
    const newOrderItems = await OrderItem.bulkCreate(
      validatedData.items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      })),
      { transaction }
    );

    // Mettre à jour le stock pour les nouveaux articles
    for (const item of validatedData.items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (product?.hasStock) {
        const stock = await Stock.findOne({ where: { productId: item.productId }, transaction });
        const currentQuantity = stock?.quantity || 0;
        
        if (currentQuantity < item.quantity) {
          await transaction.rollback();
          res.status(400).json({ error: `Stock insuffisant pour ${product.name}` });
          return;
        }

        const newQuantity = currentQuantity - item.quantity;
        
        if (stock) {
          await stock.update({ quantity: newQuantity, updatedBy: req.user!.id }, { transaction });
        } else {
          await Stock.create({
            productId: item.productId,
            quantity: newQuantity,
            updatedBy: req.user!.id,
          }, { transaction });
        }

        // Créer un mouvement de stock
        await StockMovement.create({
          productId: item.productId,
          type: 'sale',
          quantity: -item.quantity,
          previousStock: currentQuantity,
          newStock: newQuantity,
          orderId: order.id,
          createdBy: req.user!.id,
        }, { transaction });
      }
    }

    // Recalculer le total de la commande
    const currentTotal = Number(order.totalAmount);
    const newTotal = currentTotal + newItemsAmount;
    
    await order.update({ totalAmount: newTotal }, { transaction });

    // Si la commande était déjà payée (total payé >= ancien total), mettre à jour le statut de paiement
    // car le nouveau total est plus élevé
    if (totalPaid >= currentTotal && currentTotal > 0) {
      await order.update({ paymentStatus: 'pending' }, { transaction });
    }

    await transaction.commit();

    // Récupérer la commande complète mise à jour
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'phoneNumber'] },
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payments', order: [['created_at', 'DESC']] },
      ],
    });

    res.status(200).json({ order: updatedOrder });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Add items to order error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout d\'articles à la commande' });
  }
});

// Obtenir une commande par ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await Order.findByPk(orderId, {
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'phoneNumber'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payments', order: [['created_at', 'DESC']], include: [
          { model: User, as: 'creator', attributes: ['id', 'name'] },
        ]},
      ],
    });

    if (!order) {
      res.status(404).json({ error: 'Commande non trouvée' });
      return;
    }

    // Les clients ne peuvent voir que leurs propres commandes
    if (req.user!.role === 'client' && order.clientId !== req.user!.id) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la commande' });
  }
});

// Créer une commande (manager uniquement)
router.post('/', requireManager, async (req: AuthRequest, res: Response) => {
  const transaction: Transaction = await sequelize.transaction();
  
  try {
    const validatedData = createOrderSchema.parse(req.body);
    
    // Calculer le total
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Créer la commande
    const order = await Order.create({
      clientId: validatedData.clientId,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      createdBy: req.user!.id,
      tableNumber: validatedData.tableNumber,
    }, { transaction });

    // Créer les items de commande
    const orderItems = await OrderItem.bulkCreate(
      validatedData.items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      })),
      { transaction }
    );

    // Mettre à jour le stock pour les boissons
    for (const item of validatedData.items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (product?.hasStock) {
        const stock = await Stock.findOne({ where: { productId: item.productId }, transaction });
        const currentQuantity = stock?.quantity || 0;
        
        if (currentQuantity < item.quantity) {
          await transaction.rollback();
          res.status(400).json({ error: `Stock insuffisant pour ${product.name}` });
          return;
        }

        const newQuantity = currentQuantity - item.quantity;
        
        if (stock) {
          await stock.update({ quantity: newQuantity, updatedBy: req.user!.id }, { transaction });
        } else {
          await Stock.create({
            productId: item.productId,
            quantity: newQuantity,
            updatedBy: req.user!.id,
          }, { transaction });
        }

        // Créer un mouvement de stock
        await StockMovement.create({
          productId: item.productId,
          type: 'sale',
          quantity: -item.quantity,
          previousStock: currentQuantity,
          newStock: newQuantity,
          orderId: order.id,
          createdBy: req.user!.id,
        }, { transaction });
      }
    }

    // Mettre à jour le total dépensé du client
    const client = await User.findByPk(validatedData.clientId, { transaction });
    if (client) {
      await client.increment('totalSpent', { by: totalAmount, transaction });
    }

    await transaction.commit();

    // Récupérer la commande complète
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'phoneNumber'] },
        { model: OrderItem, as: 'items' },
      ],
    });

    res.status(201).json({ order: completeOrder });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
});

// Mettre à jour une commande (manager uniquement)
router.put('/:id', requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const validatedData = updateOrderSchema.parse(req.body);
    
    const order = await Order.findByPk(orderId);
    if (!order) {
      res.status(404).json({ error: 'Commande non trouvée' });
      return;
    }

    // Si la commande est complétée, mettre à jour completedAt
    const updateData: any = { ...validatedData };
    if (validatedData.status === 'completed' && order.status !== 'completed') {
      updateData.completedAt = new Date();
    }

    await order.update(updateData);
    
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'phoneNumber'] },
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payments', order: [['created_at', 'DESC']] },
      ],
    });

    res.json({ order: updatedOrder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
  }
});

export default router;
