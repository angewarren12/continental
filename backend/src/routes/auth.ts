import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User';
import { jwtConfig } from '../config/jwt';
import { formatPhoneNumber } from '../utils/phone';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Schémas de validation
const signupSchema = z.object({
  phoneNumber: z.string().min(10),
  password: z.string().min(6),
  name: z.string().min(2),
  email: z.string().email().optional(),
  role: z.enum(['manager', 'client']),
});

const loginSchema = z.object({
  phoneNumber: z.string().min(10),
  password: z.string().min(6),
});

// Inscription
router.post('/signup', async (req: Request, res: Response) => {
  try {
    console.log('[SIGNUP] Request body:', req.body);
    const validatedData = signupSchema.parse(req.body);
    const formattedPhone = formatPhoneNumber(validatedData.phoneNumber);
    console.log('[SIGNUP] Formatted phone:', formattedPhone);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { phoneNumber: formattedPhone } });
    if (existingUser) {
      res.status(400).json({ error: 'Un compte avec ce numéro existe déjà' });
      return;
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Créer l'utilisateur
    console.log('[SIGNUP] Creating user...');
    const user = await User.create({
      phoneNumber: formattedPhone,
      passwordHash,
      name: validatedData.name,
      email: validatedData.email || undefined,
      role: validatedData.role,
      totalSpent: 0,
    });
    console.log('[SIGNUP] User created:', user.id);

    // Générer le token JWT
    const token = jwt.sign({ userId: user.id }, jwtConfig.secret as string, { expiresIn: jwtConfig.expiresIn } as SignOptions);

    // Retourner l'utilisateur (sans le mot de passe)
    const userResponse = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      email: user.email || undefined,
      role: user.role,
      totalSpent: parseFloat(user.totalSpent.toString()),
      createdAt: user.createdAt,
    };

    res.status(201).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[SIGNUP] Validation error:', error.errors);
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('[SIGNUP] Error:', error);
    if (error instanceof Error) {
      console.error('[SIGNUP] Error message:', error.message);
      console.error('[SIGNUP] Error stack:', error.stack);
    }
    res.status(500).json({ 
      error: 'Erreur lors de l\'inscription',
      details: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Connexion
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const formattedPhone = formatPhoneNumber(validatedData.phoneNumber);

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { phoneNumber: formattedPhone } });
    if (!user) {
      res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect' });
      return;
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Numéro de téléphone ou mot de passe incorrect' });
      return;
    }

    // Générer le token JWT
    const token = jwt.sign({ userId: user.id }, jwtConfig.secret as string, { expiresIn: jwtConfig.expiresIn } as SignOptions);

    // Retourner l'utilisateur (sans le mot de passe)
    const userResponse = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      email: user.email,
      role: user.role,
      totalSpent: parseFloat(user.totalSpent.toString()),
      createdAt: user.createdAt,
    };

    res.json({
      user: userResponse,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Données invalides', details: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Obtenir l'utilisateur actuel
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const userResponse = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      email: user.email,
      role: user.role,
      totalSpent: parseFloat(user.totalSpent.toString()),
      createdAt: user.createdAt,
    };
    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// Déconnexion (côté client, pas besoin de route serveur pour JWT)
router.post('/logout', authenticate, (req: Request, res: Response) => {
  res.json({ message: 'Déconnexion réussie' });
});

export default router;
