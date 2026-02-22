# Checklist de Migration Firebase → MySQL

## Préparation

- [ ] Décider de l'hébergement (Backend + MySQL)
- [ ] Installer MySQL localement ou configurer cloud
- [ ] Créer la base de données MySQL
- [ ] Backup des données Firebase (si migration de données existantes)

## Backend API

### Setup initial
- [ ] Créer le dossier `backend/`
- [ ] Initialiser npm/package.json
- [ ] Configurer TypeScript
- [ ] Installer Express, Sequelize/TypeORM, JWT, bcrypt
- [ ] Configurer la connexion MySQL

### Base de données
- [ ] Créer les migrations SQL
- [ ] Créer les modèles Sequelize/TypeORM
- [ ] Créer les associations entre modèles
- [ ] Tester les migrations

### Authentification
- [ ] Route POST /auth/signup
- [ ] Route POST /auth/login
- [ ] Route POST /auth/logout
- [ ] Middleware d'authentification JWT
- [ ] Hashage des mots de passe (bcrypt)
- [ ] Validation des données d'entrée

### Routes API
- [ ] GET/POST/PUT/DELETE /api/users
- [ ] GET/POST/PUT/DELETE /api/products
- [ ] GET/POST/PUT/DELETE /api/orders
- [ ] GET/POST/PUT /api/stock
- [ ] GET /api/stock-movements

### Middleware & Utils
- [ ] Middleware d'erreur
- [ ] Middleware de validation
- [ ] Helpers pour formatage
- [ ] Gestion des erreurs HTTP

## Migration shared/

- [ ] Créer `shared/src/api/client.ts`
- [ ] Créer `shared/src/api/auth.ts`
- [ ] Créer `shared/src/api/users.ts`
- [ ] Créer `shared/src/api/products.ts`
- [ ] Créer `shared/src/api/orders.ts`
- [ ] Créer `shared/src/api/stock.ts`
- [ ] Supprimer `shared/src/firebase/`
- [ ] Mettre à jour `shared/src/index.ts`

## Migration App Manager

- [ ] Mettre à jour `AuthContext.tsx`
- [ ] Mettre à jour `LoginScreen.tsx`
- [ ] Mettre à jour `DashboardScreen.tsx`
- [ ] Mettre à jour `ClientsScreen.tsx`
- [ ] Mettre à jour `ProductsScreen.tsx`
- [ ] Mettre à jour `StockScreen.tsx`
- [ ] Mettre à jour `OrdersScreen.tsx`
- [ ] Mettre à jour `CreateOrderScreen.tsx`
- [ ] Tester toutes les fonctionnalités

## Migration App Client

- [ ] Mettre à jour `AuthContext.tsx`
- [ ] Mettre à jour `LoginScreen.tsx`
- [ ] Mettre à jour `DashboardScreen.tsx`
- [ ] Mettre à jour `OrdersScreen.tsx`
- [ ] Mettre à jour `ProfileScreen.tsx`
- [ ] Tester toutes les fonctionnalités

## Tests

- [ ] Tests unitaires backend
- [ ] Tests d'intégration API
- [ ] Tests end-to-end apps
- [ ] Tests de performance
- [ ] Tests de sécurité

## Déploiement

- [ ] Configurer variables d'environnement
- [ ] Déployer MySQL
- [ ] Déployer Backend API
- [ ] Mettre à jour les URLs dans les apps
- [ ] Déployer les apps
- [ ] Tests en production

## Documentation

- [ ] Documenter l'API (Swagger/OpenAPI)
- [ ] Mettre à jour README.md
- [ ] Créer guide de déploiement
- [ ] Documenter les migrations
