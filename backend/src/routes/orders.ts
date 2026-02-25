import { Router, Response } from 'express';
import { z } from 'zod';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import OrderSupplement from '../models/OrderSupplement';
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
    totalPrice: z.number().positive().optional(), // Prix total calculé par le frontend avec suppléments
    parentItemId: z.number().int().positive().optional(),
    isSupplement: z.boolean().optional(),
  })),
  tableNumber: z.string().optional(),
});

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional(),
  method: z.enum(['cash', 'wave']).optional(),
  tableNumber: z.string().optional().nullable(),
});

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['cash', 'wave']),
});

const addItemsToOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    productName: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    parentItemId: z.number().int().positive().optional(),
    isSupplement: z.boolean().optional(),
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
        { 
          model: OrderItem, 
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'productType'], required: false },
            { model: OrderSupplement, as: 'orderSupplements', required: false, include: [
              { model: Product, as: 'supplement', attributes: ['id', 'name', 'productType'], required: false }
            ]}
          ],
        },
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
      method: validatedData.method,
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
        method: validatedData.method, // Dernière méthode utilisée
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
        { 
          model: OrderItem, 
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'productType'], required: false },
            { model: OrderSupplement, as: 'orderSupplements', required: false, include: [
              { model: Product, as: 'supplement', attributes: ['id', 'name', 'productType'], required: false }
            ]}
          ],
        },
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
router.post('/:id/items', requireManager, async (req: AuthRequest, res: Response) => {
  const transaction: Transaction = await sequelize.transaction();
  
  console.log(' [BACKEND] ===== DÉBUT AJOUT ITEMS À COMMANDE =====');
  console.log(' [BACKEND] OrderID:', req.params.id);
  console.log(' [BACKEND] User ID:', req.user?.id);
  console.log(' [BACKEND] Request body brut:', JSON.stringify(req.body, null, 2));
  
  try {
    const orderId = parseInt(req.params.id);
    console.log(' [BACKEND] OrderID parsé:', orderId);
    
    console.log(' [BACKEND] Validation des données...');
    const validatedData = addItemsToOrderSchema.parse(req.body);
    console.log(' [BACKEND] Données validées:', JSON.stringify(validatedData, null, 2));
    
    console.log(' [BACKEND] Récupération de la commande...');
    // Récupérer la commande
    const order = await Order.findByPk(orderId, {
      include: [{ 
        model: OrderItem, 
        as: 'items',
        include: [
          { model: Product, as: 'product', attributes: ['id', 'name', 'productType'], required: false },
          { model: OrderSupplement, as: 'orderSupplements', required: false, include: [
            { model: Product, as: 'supplement', attributes: ['id', 'name', 'productType'], required: false }
          ]}
        ],
      }],
      transaction,
    });
    
    console.log(' [BACKEND] Commande trouvée:', order ? 'OUI' : 'NON');
    if (order) {
      console.log(' [BACKEND] Statut commande:', order.status);
      console.log(' [BACKEND] Total actuel:', order.totalAmount);
      console.log(' [BACKEND] Nombre d\'items existants:', order.items?.length || 0);
    }
    
    if (!order) {
      console.log(' [BACKEND] ERREUR: Commande non trouvée');
      await transaction.rollback();
      res.status(404).json({ error: 'Commande non trouvée' });
      return;
    }

    // Vérifier que la commande n'est pas complétée ou annulée
    if (order.status === 'completed' || order.status === 'cancelled') {
      console.log(' [BACKEND] ERREUR: Commande complétée/annulée');
      await transaction.rollback();
      res.status(400).json({ error: 'Impossible d\'ajouter des articles à une commande complétée ou annulée' });
      return;
    }

    console.log(' [BACKEND] Vérification des paiements existants...');
    // Vérifier que la commande n'est pas déjà payée
    // Récupérer tous les paiements existants pour vérifier le montant total payé
    const existingPayments = await Payment.findAll({
      where: { orderId },
      transaction,
    });
    const totalPaid = existingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const orderTotal = Number(order.totalAmount);
    
    console.log(' [BACKEND] Total payé:', totalPaid);
    console.log(' [BACKEND] Total commande:', orderTotal);
    
    if (totalPaid >= orderTotal && orderTotal > 0) {
      console.log(' [BACKEND] ERREUR: Commande déjà payée');
      await transaction.rollback();
      res.status(400).json({ error: 'Impossible d\'ajouter des articles à une commande déjà payée' });
      return;
    }

    console.log(' [BACKEND] Calcul du montant des nouveaux articles...');
    // Calculer le montant des nouveaux articles
    const newItemsAmount = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    console.log(' [BACKEND] Montant nouveaux articles:', newItemsAmount);

    console.log(' [BACKEND] Séparation des items principaux et suppléments...');
    // Séparer les items principaux et les suppléments
    const mainItems: any[] = [];
    const supplementItems: any[] = [];
    
    for (const item of validatedData.items) {
      console.log(' [BACKEND] Item traité:', {
        productId: item.productId,
        productName: item.productName,
        isSupplement: item.isSupplement,
        parentItemId: item.parentItemId
      });
      
      if (item.isSupplement && (item.parentItemId !== undefined || (item as any).parentItemIndex !== undefined)) {
        supplementItems.push(item);
      } else {
        mainItems.push(item);
      }
    }
    
    console.log(' [BACKEND] Items principaux:', mainItems.length);
    console.log(' [BACKEND] Items suppléments:', supplementItems.length);

    console.log(' [BACKEND] Création des items principaux...');
    // Créer d'abord les items principaux
    const createdMainItems = await OrderItem.bulkCreate(
      mainItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        isSupplement: false,
      })),
      { transaction, returning: true }
    );
    
    console.log(' [BACKEND] Items principaux créés:', createdMainItems.length);
    console.log(' [BACKEND] IDs des items créés:', createdMainItems.map(item => item.id));

    console.log(' [BACKEND] Création des suppléments...');
    // Créer les suppléments avec référence au parent
    if (supplementItems.length > 0) {
      console.log(' [BACKEND] Traitement des suppléments...');
      await OrderItem.bulkCreate(
        supplementItems.map(item => {
          let parentItemId: number | undefined;
          
          if (item.parentItemId !== undefined && item.parentItemId < 1000) {
            const parentIndex = item.parentItemId;
            if (parentIndex >= 0 && parentIndex < createdMainItems.length) {
              parentItemId = createdMainItems[parentIndex].id;
            }
          }

          console.log(' [BACKEND] Supplément - Parent ID:', parentItemId);

          return {
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            parentItemId,
            isSupplement: true,
          };
        }),
        { transaction }
      );
      console.log(' [BACKEND] Suppléments créés');
    }

    console.log(' [BACKEND] Mise à jour du stock...');
    // Mettre à jour le stock pour les nouveaux articles (exclure les plats et suppléments)
    for (const item of validatedData.items) {
      console.log(' [BACKEND] Vérification stock pour produit:', item.productId);
      
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) {
        console.log(' [BACKEND] Produit non trouvé, skip');
        continue;
      }

      console.log(' [BACKEND] Produit trouvé:', product.name, 'Type:', product.productType);

      // Ne pas gérer le stock pour les plats
      if (product.productType === 'dish') {
        console.log(' [BACKEND] Plat - pas de gestion de stock');
        continue;
      }

      // Ne pas gérer le stock pour les suppléments
      if (item.isSupplement) {
        console.log(' [BACKEND] Supplément - pas de gestion de stock');
        continue;
      }

      console.log(' [BACKEND] Vérification stock existant...');
      // Vérifier si le produit a un stock (existence dans la table stock)
      const stock = await Stock.findOne({ where: { productId: item.productId }, transaction });
      
      if (stock) {
        console.log(' [BACKEND] Stock existant trouvé, quantité:', stock.quantity);
      } else {
        console.log(' [BACKEND] Aucun stock existant pour ce produit');
      }
    }

    console.log(' [BACKEND] Recalcul du total de la commande...');
    // Recalculer le total de la commande
    const currentTotal = Number(order.totalAmount);
    const newTotal = currentTotal + newItemsAmount;
    
    console.log(' [BACKEND] Ancien total:', currentTotal);
    console.log(' [BACKEND] Nouveau total:', newTotal);
    
    await order.update({ totalAmount: newTotal }, { transaction });
    console.log(' [BACKEND] Total de la commande mis à jour');

    await transaction.commit();
    console.log(' [BACKEND] Transaction validée');

    console.log(' [BACKEND] Récupération de la commande mise à jour...');
    // Récupérer la commande complète mise à jour
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'phoneNumber'] },
        { 
          model: OrderItem, 
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'productType'], required: false },
            { model: OrderSupplement, as: 'orderSupplements', required: false, include: [
              { model: Product, as: 'supplement', attributes: ['id', 'name', 'productType'], required: false }
            ]}
          ],
        },
        { model: Payment, as: 'payments', order: [['created_at', 'DESC']] },
      ],
    });

    console.log(' [BACKEND] Commande mise à jour récupérée');
    console.log(' [BACKEND] Nombre total d\'items:', updatedOrder?.items?.length || 0);
    console.log(' [BACKEND] ===== FIN AJOUT ITEMS - SUCCÈS =====');

    res.status(200).json({ order: updatedOrder });
  } catch (error: any) {
    console.log(' [BACKEND] ===== ERREUR AJOUT ITEMS =====');
    console.error(' [BACKEND] Erreur complète:', error);
    console.log(' [BACKEND] Type erreur:', error.constructor.name);
    console.log(' [BACKEND] Message erreur:', error.message);
    console.log(' [BACKEND] Stack trace:', error.stack);
    
    await transaction.rollback();
    if (error instanceof z.ZodError) {
      console.log(' [BACKEND] Erreur de validation Zod:', error.errors);
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error(' [BACKEND] Add items to order error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout d\'articles à la commande' });
    console.log(' [BACKEND] ===== FIN ERREUR AJOUT ITEMS =====');
  }
});

// Obtenir une commande par ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
    // ... (rest of the code remains the same)
  try {
    const orderId = parseInt(req.params.id);
    const order = await Order.findByPk(orderId, {
      include: [
        { model: User, as: 'client', attributes: ['id', 'name', 'phoneNumber'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { 
          model: OrderItem, 
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'productType'], required: false },
            { model: OrderSupplement, as: 'orderSupplements', required: false, include: [
              { model: Product, as: 'supplement', attributes: ['id', 'name', 'productType'], required: false }
            ]}
          ],
        },
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
    
    // Calculer le total en utilisant les totalPrice envoyés par le frontend
    // Le frontend a déjà calculé les prix correctement avec les suppléments
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + (item.totalPrice || (item.quantity * item.unitPrice)),
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

    // Créer les items de commande (uniquement les items principaux)
    const mainItems: any[] = [];
    const supplementItems: any[] = [];
    
    for (const item of validatedData.items) {
      if (item.isSupplement && (item.parentItemId !== undefined || (item as any).parentItemIndex !== undefined)) {
        supplementItems.push(item);
      } else {
        mainItems.push(item);
      }
    }

    // Créer les items principaux
    const createdMainItems = await OrderItem.bulkCreate(
      mainItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice || (item.quantity * item.unitPrice), // Utiliser le prix du frontend ou calculer
        isSupplement: false,
      })),
      { transaction, returning: true }
    );

    // Créer les suppléments dans la table dédiée
    if (supplementItems.length > 0) {
      const supplementsToCreate: any[] = [];
      
      for (const item of supplementItems) {
        let parentItemId: number | undefined;
        
        // Si parentItemId est un petit nombre (< 1000), c'est probablement un index temporaire
        if (item.parentItemId !== undefined && item.parentItemId < 1000) {
          const parentIndex = item.parentItemId;
          if (parentIndex >= 0 && parentIndex < createdMainItems.length) {
            parentItemId = createdMainItems[parentIndex].id;
          }
        } else if (item.parentItemId !== undefined) {
          // Sinon, utiliser directement l'ID (si c'est un vrai ID de base de données)
          parentItemId = item.parentItemId;
        } else if ((item as any).parentItemIndex !== undefined) {
          // Support pour parentItemIndex explicite
          const parentIndex = (item as any).parentItemIndex;
          if (parentIndex >= 0 && parentIndex < createdMainItems.length) {
            parentItemId = createdMainItems[parentIndex].id;
          }
        }

        // Ajouter seulement si un parent valide a été trouvé
        if (parentItemId !== undefined) {
          supplementsToCreate.push({
            orderId: order.id,
            orderItemId: parentItemId,
            supplementId: item.productId,
            supplementName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          });
        }
      }

      if (supplementsToCreate.length > 0) {
        await OrderSupplement.bulkCreate(supplementsToCreate, { transaction });
      }
    }

    // Mettre à jour le stock (exclure les plats et les suppléments)
    for (const item of validatedData.items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) continue;

      // Ne pas gérer le stock pour les plats
      if (product.productType === 'dish') {
        continue;
      }

      // Ne pas gérer le stock pour les suppléments (ils sont liés aux plats)
      if (item.isSupplement) {
        continue;
      }

      // Vérifier si le produit a un stock (existence dans la table stock)
      const stock = await Stock.findOne({ where: { productId: item.productId }, transaction });
      
      if (stock) {
        
        // Gérer selon le type de produit
        if (product.productType === 'cigarette') {
          // Pour cigarettes: déduire en unités
          const previousPackets = stock?.quantityPackets || 0;
          const previousUnits = stock?.quantityUnits || 0;
          const totalPreviousUnits = previousPackets * (product.conversionFactor || 20) + previousUnits;
          
          if (totalPreviousUnits < item.quantity) {
            await transaction.rollback();
            res.status(400).json({ error: `Stock insuffisant pour ${product.name}. Disponible: ${totalPreviousUnits} cigarettes` });
            return;
          }

          const newTotalUnits = totalPreviousUnits - item.quantity;
          const newPackets = Math.floor(newTotalUnits / (product.conversionFactor || 20));
          const newUnits = newTotalUnits % (product.conversionFactor || 20);

          if (stock) {
            await stock.update({
              quantity: newTotalUnits,
              quantityPackets: newPackets,
              quantityUnits: newUnits,
              updatedBy: req.user!.id,
            }, { transaction });
          } else {
            await Stock.create({
              productId: item.productId,
              quantity: newTotalUnits,
              quantityPackets: newPackets,
              quantityUnits: newUnits,
              updatedBy: req.user!.id,
            }, { transaction });
          }

          await StockMovement.create({
            productId: item.productId,
            type: 'sale',
            quantity: -item.quantity,
            previousStock: totalPreviousUnits,
            newStock: newTotalUnits,
            orderId: order.id,
            createdBy: req.user!.id,
          }, { transaction });

        } else if (product.productType === 'egg') {
          // Pour œufs: déduire en unités
          const previousPlates = stock?.quantityPlates || 0;
          const previousUnits = stock?.quantityUnits || 0;
          const totalPreviousUnits = previousPlates * (product.conversionFactor || 30) + previousUnits;
          
          if (totalPreviousUnits < item.quantity) {
            await transaction.rollback();
            res.status(400).json({ error: `Stock insuffisant pour ${product.name}. Disponible: ${totalPreviousUnits} œufs` });
            return;
          }

          const newTotalUnits = totalPreviousUnits - item.quantity;
          const newPlates = Math.floor(newTotalUnits / (product.conversionFactor || 30));
          const newUnits = newTotalUnits % (product.conversionFactor || 30);

          if (stock) {
            await stock.update({
              quantity: newTotalUnits,
              quantityPlates: newPlates,
              quantityUnits: newUnits,
              updatedBy: req.user!.id,
            }, { transaction });
          } else {
            await Stock.create({
              productId: item.productId,
              quantity: newTotalUnits,
              quantityPlates: newPlates,
              quantityUnits: newUnits,
              updatedBy: req.user!.id,
            }, { transaction });
          }

          await StockMovement.create({
            productId: item.productId,
            type: 'sale',
            quantity: -item.quantity,
            previousStock: totalPreviousUnits,
            newStock: newTotalUnits,
            orderId: order.id,
            createdBy: req.user!.id,
          }, { transaction });

        } else {
          // Pour les autres produits (boissons, etc.): logique standard
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
        { 
          model: OrderItem, 
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'productType'], required: false },
            { model: OrderSupplement, as: 'orderSupplements', required: false, include: [
              { model: Product, as: 'supplement', attributes: ['id', 'name', 'productType'], required: false }
            ]}
          ],
        },
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
        { 
          model: OrderItem, 
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'productType'], required: false },
            { model: OrderSupplement, as: 'orderSupplements', required: false, include: [
              { model: Product, as: 'supplement', attributes: ['id', 'name', 'productType'], required: false }
            ]}
          ],
        },
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
