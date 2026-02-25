import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { syncDatabase } from './models';
import './models'; // Initialiser les modèles Sequelize
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import stockRoutes from './routes/stock';
import categoryRoutes from './routes/categories';
import uploadRoutes from './routes/upload';
import productSupplementRoutes from './routes/product-supplements';
import path from 'path';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3002;

// CORS - Doit être avant les autres middlewares
const isDevelopment = process.env.NODE_ENV !== 'production';
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    console.log(`[CORS] Request from origin: ${origin || 'no origin'}`);
    
    // En développement, autoriser toutes les origines localhost
    if (isDevelopment) {
      // Autoriser les requêtes sans origine (ex: Postman, mobile apps)
      if (!origin) {
        console.log('[CORS] Allowing request without origin (development)');
        callback(null, true);
        return;
      }
      // Autoriser toutes les origines localhost en développement
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log(`[CORS] Allowing localhost origin: ${origin}`);
        callback(null, true);
        return;
      }
    }
    
    // En production, utiliser la liste des origines autorisées
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
    
    // Autoriser les requêtes depuis les apps Capacitor (pas d'origine)
    if (!origin) {
      console.log('[CORS] Allowing request without origin (Capacitor app)');
      callback(null, true);
      return;
    }
    
    // Autoriser les origines Capacitor
    if (origin.startsWith('capacitor://') || origin.startsWith('ionic://')) {
      console.log(`[CORS] Allowing Capacitor origin: ${origin}`);
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`[CORS] Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200, // Pour les anciens navigateurs
  preflightContinue: false,
  maxAge: 86400, // Cache les résultats preflight pendant 24 heures
};
app.use(cors(corsOptions));

// Gérer explicitement les requêtes OPTIONS pour toutes les routes API
app.options('*', cors(corsOptions));

// Middleware de sécurité (après CORS pour éviter les conflits)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Compression pour améliorer les performances
app.use(compression());

// Servir les fichiers statiques (images)
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting pour la sécurité et les performances
// En développement, désactiver par défaut (peut être activé avec ENABLE_RATE_LIMIT=true)
// En production, toujours activé
if (!isDevelopment || process.env.ENABLE_RATE_LIMIT === 'true') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || (isDevelopment ? '60000' : '900000')), // 1 min en dev, 15 min en prod
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (isDevelopment ? '1000' : '100')), // 1000 en dev, 100 en prod
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Ignorer les requêtes OPTIONS (preflight CORS)
      if (req.method === 'OPTIONS') return true;
      // En développement, ignorer le rate limiting pour certaines routes critiques
      if (isDevelopment && req.path === '/api/auth/me') return true;
      return false;
    },
  });
  app.use('/api/', limiter);
  if (isDevelopment) {
    console.log('[RATE LIMIT] Rate limiting activé en développement (limite: 1000 req/min)');
  }
} else {
  console.log('[RATE LIMIT] Rate limiting désactivé en développement');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/products', productSupplementRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test CORS
app.get('/api/test-cors', (req: Request, res: Response) => {
  res.json({ 
    message: 'CORS fonctionne!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString() 
  });
});

// Gestion des erreurs
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : err.message,
  });
});

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    await connectDatabase();
    await syncDatabase(); // Créer les tables automatiquement
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage:', error);
    process.exit(1);
  }
};

startServer();

export default app;
