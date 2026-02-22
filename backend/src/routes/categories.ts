import { Router, Response } from 'express';
import { z } from 'zod';
import Category from '../models/Category';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth';

const router = Router();

// Schémas de validation
const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  isActive: z.boolean().optional(),
});

// Obtenir toutes les catégories actives
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const isManager = req.user!.role === 'manager';
    const where: any = {};
    
    if (!isManager) {
      where.isActive = true;
    }

    const categories = await Category.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// Obtenir une catégorie par ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const category = await Category.findByPk(categoryId);

    if (!category) {
      res.status(404).json({ error: 'Catégorie non trouvée' });
      return;
    }

    // Les clients ne peuvent voir que les catégories actives
    if (req.user!.role === 'client' && !category.isActive) {
      res.status(404).json({ error: 'Catégorie non trouvée' });
      return;
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la catégorie' });
  }
});

// Créer une catégorie (manager uniquement)
router.post('/', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createCategorySchema.parse(req.body);
    
    // Vérifier si une catégorie avec le même nom existe déjà
    const existingCategory = await Category.findOne({
      where: { name: validatedData.name },
    });

    if (existingCategory) {
      res.status(400).json({ error: 'Une catégorie avec ce nom existe déjà' });
      return;
    }

    const category = await Category.create({
      ...validatedData,
      color: validatedData.color || '#bd0f3b',
      isActive: true,
    });

    res.status(201).json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
  }
});

// Mettre à jour une catégorie (manager uniquement)
router.put('/:id', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const validatedData = updateCategorySchema.parse(req.body);
    
    const category = await Category.findByPk(categoryId);
    if (!category) {
      res.status(404).json({ error: 'Catégorie non trouvée' });
      return;
    }

    // Vérifier si le nouveau nom existe déjà (si le nom est modifié)
    if (validatedData.name && validatedData.name !== category.name) {
      const existingCategory = await Category.findOne({
        where: { name: validatedData.name },
      });

      if (existingCategory) {
        res.status(400).json({ error: 'Une catégorie avec ce nom existe déjà' });
        return;
      }
    }

    await category.update(validatedData);
    res.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la catégorie' });
  }
});

// Supprimer une catégorie (manager uniquement)
router.delete('/:id', authenticate, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const category = await Category.findByPk(categoryId);
    
    if (!category) {
      res.status(404).json({ error: 'Catégorie non trouvée' });
      return;
    }

    // Vérifier si la catégorie est utilisée par des produits
    const { Product } = require('../models');
    const productsCount = await Product.count({
      where: { categoryId: categoryId },
    });

    if (productsCount > 0) {
      res.status(400).json({ 
        error: `Impossible de supprimer cette catégorie. ${productsCount} produit(s) l'utilise(nt).`,
      });
      return;
    }

    await category.destroy();
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
  }
});

export default router;
