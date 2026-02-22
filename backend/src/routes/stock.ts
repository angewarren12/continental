import { Router, Response } from 'express';
import { z } from 'zod';
import { Transaction } from 'sequelize';
import sequelize from '../config/database';
import { Stock, StockMovement, Product, Category } from '../models';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireManager); // Toutes les routes stock nécessitent le rôle manager

// Schéma de validation
const updateStockSchema = z.object({
  quantity: z.number().int().min(0),
  type: z.enum(['restock', 'adjustment']),
});

// Obtenir tout le stock
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;

    // Récupérer tous les stocks avec les produits
    const stocks = await Stock.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'type', 'unit', 'imageUrl', 'categoryId'],
          include: [
            {
              model: Category,
              as: 'categoryDetail',
              attributes: ['id', 'name', 'icon', 'color'],
              required: false,
            },
          ],
        },
      ],
    });

    // Filtrer par catégorie si nécessaire
    let filteredStocks = stocks;
    if (categoryId) {
      filteredStocks = stocks.filter(
        (stock) => stock.product && stock.product.categoryId === categoryId
      );
    }

    // Trier par nom de produit
    filteredStocks.sort((a, b) => {
      const nameA = a.product?.name || '';
      const nameB = b.product?.name || '';
      return nameA.localeCompare(nameB);
    });

    // Statistiques
    const totalEntries = await StockMovement.sum('quantity', {
      where: { type: 'restock' },
    }) || 0;

    const totalExits = await StockMovement.sum('quantity', {
      where: { type: 'sale' },
    }) || 0;

    res.json({
      stocks: filteredStocks,
      statistics: {
        totalEntries,
        totalExits,
        totalProducts: filteredStocks.length,
      },
    });
  } catch (error) {
    console.error('Get stocks error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du stock' });
  }
});

// Obtenir le stock d'un produit
router.get('/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const stock = await Stock.findOne({
      where: { productId },
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'type', 'unit'] },
      ],
    });

    if (!stock) {
      res.status(404).json({ error: 'Stock non trouvé pour ce produit' });
      return;
    }

    res.json({ stock });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du stock' });
  }
});

// Mettre à jour le stock
router.put('/:productId', async (req: AuthRequest, res: Response) => {
  const transaction: Transaction = await sequelize.transaction();
  
  try {
    const productId = parseInt(req.params.productId);
    const validatedData = updateStockSchema.parse(req.body);

    // Vérifier que le produit existe
    const product = await Product.findByPk(productId, { transaction });
    if (!product) {
      await transaction.rollback();
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }

    // Récupérer ou créer le stock
    let stock = await Stock.findOne({ where: { productId }, transaction });
    const previousStock = stock?.quantity || 0;
    const newStock = validatedData.quantity;

    if (stock) {
      await stock.update(
        { quantity: newStock, updatedBy: req.user!.id },
        { transaction }
      );
    } else {
      stock = await Stock.create({
        productId,
        quantity: newStock,
        updatedBy: req.user!.id,
      }, { transaction });
    }

    // Créer un mouvement de stock
    await StockMovement.create({
      productId,
      type: validatedData.type,
      quantity: validatedData.type === 'restock' ? newStock - previousStock : newStock - previousStock,
      previousStock,
      newStock,
      createdBy: req.user!.id,
    }, { transaction });

    await transaction.commit();

    const updatedStock = await Stock.findByPk(stock.id, {
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'type', 'unit'] },
      ],
    });

    res.json({ stock: updatedStock });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du stock' });
  }
});

// Obtenir l'historique des mouvements de stock
router.get('/:productId/movements', async (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const movements = await StockMovement.findAll({
      where: { productId },
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ movements });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

export default router;
