import { Router, Response } from 'express';
import { z } from 'zod';
import { Transaction, Op } from 'sequelize';
import sequelize from '../config/database';
import { Stock, StockMovement, Product, Category } from '../models';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireManager); // Toutes les routes stock nécessitent le rôle manager

// Schéma de validation
const updateStockSchema = z.object({
  quantity: z.number().int().min(0).optional(),
  quantityPackets: z.number().int().min(0).optional(),
  quantityUnits: z.number().int().min(0).optional(),
  quantityPlates: z.number().int().min(0).optional(),
  type: z.enum(['restock', 'adjustment']),
}).refine(
  (data) => data.quantity !== undefined || data.quantityPackets !== undefined ||
    data.quantityUnits !== undefined || data.quantityPlates !== undefined,
  { message: 'Au moins une quantité doit être fournie' }
);

// Obtenir tout le stock
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;

    // Récupérer tous les stocks avec les produits
    // Exclure les plats (product_type = 'dish') qui n'ont pas de stock
    const stocks = await Stock.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'productType', 'stockUnit', 'saleUnit', 'conversionFactor', 'imageUrl', 'categoryId'],
          where: {
            productType: {
              [Op.ne]: 'dish', // Exclure les plats
            },
          },
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
        { model: Product, as: 'product', attributes: ['id', 'name', 'productType', 'stockUnit', 'saleUnit'] },
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

    // Ne pas permettre la gestion de stock pour les plats
    if (product.productType === 'dish') {
      await transaction.rollback();
      res.status(400).json({ error: 'Les plats ne gèrent pas de stock' });
      return;
    }

    // Récupérer ou créer le stock
    let stock = await Stock.findOne({ where: { productId }, transaction });

    // Gérer les différentes unités selon le type de produit
    let updateData: any = { updatedBy: req.user!.id };
    let previousStock = stock?.quantity || 0;
    let newStock = previousStock;
    let quantityChange = 0;

    if (product.productType === 'cigarette') {
      // Pour les cigarettes: gérer paquets et unités
      const previousPackets = stock?.quantityPackets || 0;
      const previousUnits = stock?.quantityUnits || 0;

      if (validatedData.quantityPackets !== undefined) {
        updateData.quantityPackets = validatedData.quantityPackets;
        newStock = validatedData.quantityPackets * (product.conversionFactor || 20) + (stock?.quantityUnits || 0);
      }
      if (validatedData.quantityUnits !== undefined) {
        updateData.quantityUnits = validatedData.quantityUnits;
        // Convertir les unités en paquets si nécessaire
        const totalUnits = (stock?.quantityPackets || 0) * (product.conversionFactor || 20) + validatedData.quantityUnits;
        updateData.quantityPackets = Math.floor(totalUnits / (product.conversionFactor || 20));
        updateData.quantityUnits = totalUnits % (product.conversionFactor || 20);
        newStock = totalUnits;
      }
      if (validatedData.quantity !== undefined) {
        // Si quantity est fourni, le traiter comme des unités
        const totalUnits = validatedData.quantity;
        updateData.quantityPackets = Math.floor(totalUnits / (product.conversionFactor || 20));
        updateData.quantityUnits = totalUnits % (product.conversionFactor || 20);
        newStock = totalUnits;
      }

      previousStock = previousPackets * (product.conversionFactor || 20) + previousUnits;
      quantityChange = newStock - previousStock;
    } else if (product.productType === 'egg') {
      // Pour les œufs: gérer plaquettes et unités
      const previousPlates = stock?.quantityPlates || 0;
      const previousUnits = stock?.quantityUnits || 0;

      if (validatedData.quantityPlates !== undefined) {
        updateData.quantityPlates = validatedData.quantityPlates;
        newStock = validatedData.quantityPlates * (product.conversionFactor || 30) + (stock?.quantityUnits || 0);
      }
      if (validatedData.quantityUnits !== undefined) {
        updateData.quantityUnits = validatedData.quantityUnits;
        // Convertir les unités en plaquettes si nécessaire
        const totalUnits = (stock?.quantityPlates || 0) * (product.conversionFactor || 30) + validatedData.quantityUnits;
        updateData.quantityPlates = Math.floor(totalUnits / (product.conversionFactor || 30));
        updateData.quantityUnits = totalUnits % (product.conversionFactor || 30);
        newStock = totalUnits;
      }
      if (validatedData.quantity !== undefined) {
        // Si quantity est fourni, le traiter comme des unités
        const totalUnits = validatedData.quantity;
        updateData.quantityPlates = Math.floor(totalUnits / (product.conversionFactor || 30));
        updateData.quantityUnits = totalUnits % (product.conversionFactor || 30);
        newStock = totalUnits;
      }

      previousStock = previousPlates * (product.conversionFactor || 30) + previousUnits;
      quantityChange = newStock - previousStock;
    } else {
      // Pour les autres produits (boissons, etc.): utiliser quantity standard
      if (validatedData.quantity !== undefined) {
        updateData.quantity = validatedData.quantity;
        newStock = validatedData.quantity;
        quantityChange = newStock - previousStock;
      }
    }

    updateData.quantity = newStock; // Garder quantity pour compatibilité

    if (stock) {
      await stock.update(updateData, { transaction });
    } else {
      stock = await Stock.create({
        productId,
        ...updateData,
      }, { transaction });
    }

    // Créer un mouvement de stock
    await StockMovement.create({
      productId,
      type: validatedData.type,
      quantity: quantityChange,
      previousStock,
      newStock,
      createdBy: req.user!.id,
    }, { transaction });

    await transaction.commit();

    const updatedStock = await Stock.findByPk(stock.id, {
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'productType', 'stockUnit', 'saleUnit'] },
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
