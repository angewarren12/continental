import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth';
import { formatPhoneNumber } from '../utils/phone';

const router = Router();

// Tous les routes nécessitent une authentification
router.use(authenticate);

// Obtenir tous les utilisateurs (gestionnaires uniquement)
router.get('/', requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
    });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Obtenir un utilisateur par ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    // Les clients ne peuvent voir que leur propre profil
    if (req.user!.role === 'client' && user.id !== req.user!.id) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

// Rechercher un utilisateur par téléphone (gestionnaires uniquement)
router.get('/search/phone/:phone', requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { formatPhoneNumber } = await import('../utils/phone');
    const formattedPhone = formatPhoneNumber(req.params.phone);
    
    const user = await User.findOne({
      where: { phoneNumber: formattedPhone },
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Search user error:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

// Créer un client (gestionnaires uniquement)
const createClientSchema = z.object({
  name: z.string().min(2),
  phoneNumber: z.string().min(10),
  password: z.string().min(6),
  email: z.string().email().optional().nullable(),
});

router.post('/', requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createClientSchema.parse(req.body);
    const formattedPhone = formatPhoneNumber(validatedData.phoneNumber);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { phoneNumber: formattedPhone } });
    if (existingUser) {
      res.status(400).json({ error: 'Un compte avec ce numéro existe déjà' });
      return;
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Créer l'utilisateur
    const user = await User.create({
      phoneNumber: formattedPhone,
      passwordHash,
      name: validatedData.name,
      email: validatedData.email || null,
      role: 'client',
      totalSpent: 0,
    });

    const userResponse = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      email: user.email || undefined,
      role: user.role,
      totalSpent: parseFloat(user.totalSpent.toString()),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(201).json({ user: userResponse });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du client' });
  }
});

// Mettre à jour un utilisateur
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().nullable(),
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Les clients ne peuvent modifier que leur propre profil
    if (req.user!.role === 'client' && userId !== req.user!.id) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const validatedData = updateUserSchema.parse(req.body);
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    // Les clients ne peuvent pas modifier leur rôle ou totalSpent
    if (req.user!.role === 'client') {
      delete (validatedData as any).role;
      delete (validatedData as any).totalSpent;
    }

    await user.update(validatedData);

    const userResponse = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      email: user.email,
      role: user.role,
      totalSpent: parseFloat(user.totalSpent.toString()),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({ user: userResponse });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Changer le mot de passe
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
});

router.put('/:id/password', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Les clients ne peuvent modifier que leur propre mot de passe
    if (req.user!.role === 'client' && userId !== req.user!.id) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const validatedData = changePasswordSchema.parse(req.body);
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(validatedData.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      return;
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(validatedData.newPassword, 10);
    await user.update({ passwordHash });

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

export default router;
