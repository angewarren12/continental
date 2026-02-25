import { Router, Response } from 'express';
import { z } from 'zod';
import { ProductSupplement, Product } from '../models';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireManager);

// Schéma de validation
const createSupplementSchema = z.object({
  supplementId: z.number().int().positive(),
  isAvailable: z.boolean().optional(),
});

const updateSupplementSchema = z.object({
  isAvailable: z.boolean(),
});

// Obtenir tous les suppléments disponibles pour un produit
router.get('/:productId/supplements', async (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    
    // Vérifier que le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }

    // Récupérer les suppléments disponibles pour ce produit
    const supplements = await ProductSupplement.findAll({
      where: { productId, isAvailable: true },
      include: [
        {
          model: Product,
          as: 'supplement',
          attributes: ['id', 'name', 'price', 'productType', 'imageUrl'],
        },
      ],
    });

    res.json({ supplements });
  } catch (error) {
    console.error('Get supplements error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des suppléments' });
  }
});

// Ajouter un supplément à un produit
router.post('/:productId/supplements', async (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const validatedData = createSupplementSchema.parse(req.body);

    // Vérifier que le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404).json({ error: 'Produit non trouvé' });
      return;
    }

    // Vérifier que le supplément existe et est bien un supplément
    const supplement = await Product.findByPk(validatedData.supplementId);
    if (!supplement) {
      res.status(404).json({ error: 'Supplément non trouvé' });
      return;
    }

    if (supplement.productType !== 'supplement') {
      res.status(400).json({ error: 'Le produit spécifié n\'est pas un supplément' });
      return;
    }

    // Vérifier si la relation existe déjà
    const existing = await ProductSupplement.findOne({
      where: { productId, supplementId: validatedData.supplementId },
    });

    if (existing) {
      // Mettre à jour si elle existe déjà
      await existing.update({ isAvailable: validatedData.isAvailable ?? true });
      res.json({ supplement: existing });
      return;
    }

    // Créer la relation
    const productSupplement = await ProductSupplement.create({
      productId,
      supplementId: validatedData.supplementId,
      isAvailable: validatedData.isAvailable ?? true,
    });

    const created = await ProductSupplement.findByPk(productSupplement.id, {
      include: [
        {
          model: Product,
          as: 'supplement',
          attributes: ['id', 'name', 'price', 'productType', 'imageUrl'],
        },
      ],
    });

    res.status(201).json({ supplement: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Create supplement error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du supplément' });
  }
});

// Retirer un supplément d'un produit
router.delete('/:productId/supplements/:supplementId', async (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const supplementId = parseInt(req.params.supplementId);

    const productSupplement = await ProductSupplement.findOne({
      where: { productId, supplementId },
    });

    if (!productSupplement) {
      res.status(404).json({ error: 'Relation produit-supplément non trouvée' });
      return;
    }

    await productSupplement.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Delete supplement error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du supplément' });
  }
});

// Mettre à jour la disponibilité d'un supplément
router.put('/:productId/supplements/:supplementId', async (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const supplementId = parseInt(req.params.supplementId);
    const validatedData = updateSupplementSchema.parse(req.body);

    const productSupplement = await ProductSupplement.findOne({
      where: { productId, supplementId },
    });

    if (!productSupplement) {
      res.status(404).json({ error: 'Relation produit-supplément non trouvée' });
      return;
    }

    await productSupplement.update({ isAvailable: validatedData.isAvailable });

    const updated = await ProductSupplement.findByPk(productSupplement.id, {
      include: [
        {
          model: Product,
          as: 'supplement',
          attributes: ['id', 'name', 'price', 'productType', 'imageUrl'],
        },
      ],
    });

    res.json({ supplement: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Update supplement error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du supplément' });
  }
});

export default router;
