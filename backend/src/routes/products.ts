import { Router, Response } from 'express';
import { z } from 'zod';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import Product from '../models/Product';
import Category from '../models/Category';
import Stock from '../models/Stock';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth';

const router = Router();

// Schémas de validation
const createProductSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['food', 'drink', 'service']),
  categoryId: z.number().int().positive().optional(),
  type: z.string().min(1),
  imageUrl: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      return val;
    },
    z.string().refine(
      (val) => {
        if (!val) return true; // undefined/null est OK
        // Accepter soit une URL complète, soit un chemin relatif commençant par /
        return val.startsWith('http') || val.startsWith('/');
      },
      {
        message: 'L\'imageUrl doit être une URL complète (http://...) ou un chemin relatif commençant par /',
      }
    ).optional()
  ),
  description: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      return val;
    },
    z.string().optional()
  ),
  price: z.number().positive(),
  hasStock: z.boolean().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  unit: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      return val;
    },
    z.string().optional()
  ),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.number().int().positive().optional().nullable(),
  imageUrl: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      return val;
    },
    z.union([
      z.string().refine(
        (val) => {
          // Accepter soit une URL complète, soit un chemin relatif commençant par /
          return val.startsWith('http') || val.startsWith('/');
        },
        {
          message: 'L\'imageUrl doit être une URL complète (http://...) ou un chemin relatif commençant par /',
        }
      ),
      z.undefined(),
    ]).optional()
  ),
  description: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      return val;
    },
    z.string().optional().nullable()
  ),
  price: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

// Obtenir tous les produits (actifs pour tous, tous pour managers)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const isManager = req.user!.role === 'manager';
    const where: any = {};
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    
    if (!isManager) {
      where.isActive = true;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await Product.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'categoryDetail',
          attributes: ['id', 'name', 'icon', 'color'],
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
  }
});

// Obtenir un produit par ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Category,
          as: 'categoryDetail',
          attributes: ['id', 'name', 'icon', 'color'],
          required: false,
        },
      ],
    });

    if (!product) {
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }

    // Les clients ne peuvent voir que les produits actifs
    if (req.user!.role === 'client' && !product.isActive) {
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
  }
});

// Créer un produit (manager uniquement)
router.post('/', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
  const transaction: Transaction = await sequelize.transaction();
  
  try {
    console.log('[CREATE PRODUCT] Request body:', JSON.stringify(req.body, null, 2));
    const validatedData = createProductSchema.parse(req.body);
    console.log('[CREATE PRODUCT] Validated data:', JSON.stringify(validatedData, null, 2));
    
    const product = await Product.create({
      ...validatedData,
      hasStock: validatedData.hasStock ?? false,
      isActive: true,
    }, { transaction });

    // Si le produit a la gestion de stock activée, créer l'enregistrement de stock
    if (product.hasStock) {
      const initialQuantity = validatedData.stockQuantity !== undefined ? validatedData.stockQuantity : 0;
      await Stock.create({
        productId: product.id,
        quantity: initialQuantity,
        updatedBy: req.user!.id,
      }, { transaction });
      console.log(`[CREATE PRODUCT] Stock créé pour produit ${product.id} avec quantité ${initialQuantity}`);
    }

    await transaction.commit();

    // Récupérer le produit avec ses relations
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: 'categoryDetail',
          attributes: ['id', 'name', 'icon', 'color'],
          required: false,
        },
      ],
    });

    res.status(201).json({ product: createdProduct });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof z.ZodError) {
      console.error('[CREATE PRODUCT] Validation error:', error.errors);
      res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors,
        received: req.body 
      });
      return;
    }
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du produit' });
  }
});

// Mettre à jour un produit (manager uniquement)
router.put('/:id', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const validatedData = updateProductSchema.parse(req.body);
    
    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }

    await product.update(validatedData);
    res.json({ product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[UPDATE PRODUCT] Validation error:', error.errors);
      console.error('[UPDATE PRODUCT] Received data:', req.body);
      res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors,
        received: req.body 
      });
      return;
    }
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du produit' });
  }
});

// Supprimer un produit (manager uniquement)
router.delete('/:id', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await Product.findByPk(productId);
    
    if (!product) {
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }

    await product.destroy();
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
  }
});

export default router;
