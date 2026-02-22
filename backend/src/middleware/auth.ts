import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: User;
  userId?: number;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token d\'authentification manquant' });
      return;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, jwtConfig.secret) as { userId: number };
    
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      res.status(401).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

export const requireManager = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(403).json({ error: 'Accès refusé. Utilisateur non authentifié.' });
    return;
  }
  
  // Log pour déboguer
  console.log(`[AUTH] User ID: ${req.user.id}, Role: ${req.user.role}, Expected: manager`);
  
  if (req.user.role !== 'manager') {
    res.status(403).json({ 
      error: 'Accès refusé. Rôle gestionnaire requis.',
      userRole: req.user.role,
      userId: req.user.id
    });
    return;
  }
  next();
};

export const requireClient = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'client') {
    res.status(403).json({ error: 'Accès refusé. Rôle client requis.' });
    return;
  }
  next();
};
