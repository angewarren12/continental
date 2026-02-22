# Backend API - Le Continental

API REST Node.js + Express + MySQL pour l'application Le Continental.

## Technologies

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **MySQL** + **Sequelize** - Base de données et ORM
- **JWT** - Authentification
- **bcryptjs** - Hashage des mots de passe
- **Zod** - Validation des données
- **Helmet** - Sécurité HTTP
- **Compression** - Optimisation des performances
- **Rate Limiting** - Protection contre les abus

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copier `.env.example` vers `.env`
2. Configurer les variables d'environnement :

```env
PORT=3002
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=continental_db
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## Base de données

### Créer la base de données MySQL

```sql
CREATE DATABASE continental_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Exécuter les migrations

```bash
# Via MySQL CLI
mysql -u root -p continental_db < src/migrations/001_create_tables.sql

# Ou via Sequelize (à venir)
npm run migrate
```

## Démarrage

### Mode développement

```bash
npm run dev
```

Le serveur démarre sur http://localhost:3002

### Mode production

```bash
npm run build
npm start
```

## API Endpoints

### Authentification

- `POST /api/auth/signup` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur actuel
- `POST /api/auth/logout` - Déconnexion

### Utilisateurs

- `GET /api/users` - Liste des utilisateurs (manager)
- `GET /api/users/:id` - Détails d'un utilisateur
- `GET /api/users/search/phone/:phone` - Recherche par téléphone (manager)
- `PUT /api/users/:id` - Mettre à jour un utilisateur

### Produits

- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/products` - Créer un produit (manager)
- `PUT /api/products/:id` - Mettre à jour un produit (manager)
- `DELETE /api/products/:id` - Supprimer un produit (manager)

### Commandes

- `GET /api/orders` - Liste des commandes
- `GET /api/orders/:id` - Détails d'une commande
- `POST /api/orders` - Créer une commande (manager)
- `PUT /api/orders/:id` - Mettre à jour une commande (manager)

### Stock

- `GET /api/stock` - Liste du stock (manager)
- `GET /api/stock/:productId` - Stock d'un produit (manager)
- `PUT /api/stock/:productId` - Mettre à jour le stock (manager)
- `GET /api/stock/:productId/movements` - Historique des mouvements (manager)

## Optimisations de performance

✅ **Connection Pooling** - Pool de connexions MySQL optimisé
✅ **Compression** - Compression gzip pour les réponses
✅ **Rate Limiting** - Protection contre les abus
✅ **Indexes** - Index sur les colonnes fréquemment interrogées
✅ **Helmet** - Headers de sécurité HTTP
✅ **Caching** - À implémenter si nécessaire

## Sécurité

- ✅ Authentification JWT
- ✅ Hashage bcrypt des mots de passe
- ✅ Validation des données avec Zod
- ✅ Rate limiting
- ✅ CORS configuré
- ✅ Helmet pour les headers de sécurité

## Structure

```
backend/
├── src/
│   ├── config/          # Configuration (DB, JWT)
│   ├── models/          # Modèles Sequelize
│   ├── routes/          # Routes API
│   ├── controllers/     # Logique métier (à venir)
│   ├── middleware/      # Middleware (auth, validation)
│   ├── utils/           # Utilitaires
│   ├── migrations/      # Migrations SQL
│   └── server.ts        # Point d'entrée
├── package.json
└── tsconfig.json
```
