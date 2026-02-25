import { Router, Response } from 'express';
import { z } from 'zod';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import Product from '../models/Product';
import Category from '../models/Category';
import Stock from '../models/Stock';
import ProductSupplement from '../models/ProductSupplement';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth';

const router = Router();

// Schémas de validation
const productSupplementSchema = z.object({
  supplementId: z.number().int().positive().optional().nullable(),
  supplement_name: z.string().optional().nullable(),
  supplement_price: z.number().positive().optional().nullable(),
}).refine(data => (data.supplementId != null) || (data.supplement_name != null && data.supplement_price != null), {
  message: "Either supplementId or both supplement_name and supplement_price must be provided"
});

const createProductSchema = z.object({
  name: z.string().min(1),
  categoryId: z.number().int().positive(),
  productType: z.enum(['food', 'dish', 'drink', 'cigarette', 'egg', 'supplement', 'service']),
  stockUnit: z.enum(['packet', 'unit', 'plate']).optional().nullable(),
  saleUnit: z.enum(['packet', 'unit', 'plate']).optional(),
  conversionFactor: z.number().int().positive().optional().nullable(),
  supplements: z.array(productSupplementSchema).optional(),
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
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.number().int().positive().optional(),
  productType: z.enum(['food', 'dish', 'drink', 'cigarette', 'egg', 'supplement', 'service']).optional(),
  stockUnit: z.enum(['packet', 'unit', 'plate']).optional().nullable(),
  saleUnit: z.enum(['packet', 'unit', 'plate']).optional(),
  conversionFactor: z.number().int().positive().optional().nullable(),
  supplements: z.array(productSupplementSchema).optional(),
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
          attributes: ['id', 'name', 'icon', 'color', 'mainCategory'],
          required: false,
        },
        {
          model: ProductSupplement,
          as: 'supplements',
          required: false,
          include: [
            {
              model: Product,
              as: 'supplement',
              attributes: ['id', 'name', 'price'],
              required: false,
            }
          ]
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
          attributes: ['id', 'name', 'icon', 'color', 'mainCategory'],
          required: false,
        },
        {
          model: ProductSupplement,
          as: 'supplements',
          required: false,
          include: [
            {
              model: Product,
              as: 'supplement',
              attributes: ['id', 'name', 'price'],
              required: false,
            }
          ]
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

    // Extraire les suppléments avant de créer le produit
    const { supplements, ...productData } = validatedData;

    const product = await Product.create({
      ...productData,
      isActive: true,
    }, { transaction });

    // Créer les suppléments intégrés si c'est un plat ou un food avec suppléments
    if (supplements && supplements.length > 0 && (product.productType === 'dish' || product.productType === 'food')) {
      console.log('[CREATE PRODUCT] Creating supplements:', JSON.stringify(supplements, null, 2));
      const createdSupplements = await ProductSupplement.bulkCreate(
        supplements.map((supplement) => ({
          productId: product.id,
          supplementId: null, // null car c'est un supplément intégré, pas un produit existant
          supplement_name: supplement.supplement_name,
          supplement_price: supplement.supplement_price,
        })),
        { transaction }
      );
      console.log(`[CREATE PRODUCT] ${createdSupplements.length} supplements créés pour produit ${product.id}`);
    } else {
      console.log('[CREATE PRODUCT] No supplements to create:', {
        hasSupplements: supplements && supplements.length > 0,
        productType: product.productType,
        supplements: supplements
      });
    }

    await transaction.commit();

    // Récupérer le produit avec ses relations
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: 'categoryDetail',
          attributes: ['id', 'name', 'icon', 'color', 'mainCategory'],
          required: false,
        },
        {
          model: ProductSupplement,
          as: 'supplements',
          required: false,
          include: [
            {
              model: Product,
              as: 'supplement',
              attributes: ['id', 'name', 'price'],
              required: false,
            }
          ]
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
  const transaction: Transaction = await sequelize.transaction();

  try {
    const productId = parseInt(req.params.id);
    const validatedData = updateProductSchema.parse(req.body);

    const product = await Product.findByPk(productId, { transaction });
    if (!product) {
      await transaction.rollback();
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }

    // Extraire les suppléments avant de mettre à jour le produit
    const { supplements, ...productData } = validatedData;

    await product.update(productData, { transaction });

    // Mettre à jour les suppléments si c'est un plat
    if (supplements !== undefined && product.productType === 'dish') {
      console.log('[UPDATE PRODUCT] Updating supplements for product:', productId, 'Supplements:', JSON.stringify(supplements, null, 2));
      // Supprimer les anciens suppléments
      const deletedCount = await ProductSupplement.destroy({
        where: { productId: productId },
        transaction,
      });
      console.log(`[UPDATE PRODUCT] ${deletedCount} anciens suppléments supprimés`);

      // Créer les nouveaux suppléments
      if (supplements && supplements.length > 0) {
        const createdSupplements = await ProductSupplement.bulkCreate(
          supplements.map((supplement) => ({
            productId: productId,
            supplementId: supplement.supplementId,
            supplement_name: supplement.supplement_name,
            supplement_price: supplement.supplement_price,
          })),
          { transaction }
        );
        console.log(`[UPDATE PRODUCT] ${createdSupplements.length} nouveaux suppléments créés`);
      } else {
        console.log('[UPDATE PRODUCT] Aucun supplément à créer (tableau vide)');
      }
    } else {
      console.log('[UPDATE PRODUCT] Suppléments non mis à jour:', {
        supplementsDefined: supplements !== undefined,
        productType: product.productType
      });
    }

    await transaction.commit();

    // Récupérer le produit mis à jour avec ses relations
    const updatedProduct = await Product.findByPk(productId, {
      include: [
        {
          model: Category,
          as: 'categoryDetail',
          attributes: ['id', 'name', 'icon', 'color', 'mainCategory'],
          required: false,
        },
        {
          model: ProductSupplement,
          as: 'supplements',
          required: false,
          include: [
            {
              model: Product,
              as: 'supplement',
              attributes: ['id', 'name', 'price'],
              required: false,
            }
          ]
        },
      ],
    });

    res.json({ product: updatedProduct });
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
