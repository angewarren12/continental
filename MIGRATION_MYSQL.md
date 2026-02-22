# Plan de Migration : Firebase → MySQL

## Vue d'ensemble

Migration complète de Firebase (Firestore + Auth) vers MySQL avec une API REST backend.

## Architecture cible

```
┌─────────────────┐         ┌──────────────┐         ┌──────────┐
│   App Manager   │────────▶│   API REST   │────────▶│  MySQL   │
│   (React)       │         │  (Express)   │         │ Database │
└─────────────────┘         └──────────────┘         └──────────┘
┌─────────────────┐         │              │
│   App Client    │────────▶│              │
│   (React)       │         │              │
└─────────────────┘         └──────────────┘
```

## Composants à créer/modifier

### 1. Backend API (Nouveau)
- **Technologies** : Node.js + Express + TypeScript
- **Base de données** : MySQL (avec Sequelize ou TypeORM)
- **Authentification** : JWT (JSON Web Tokens)
- **Validation** : Joi ou Zod
- **Structure** :
  ```
  backend/
  ├── src/
  │   ├── config/
  │   │   ├── database.ts      # Configuration MySQL
  │   │   └── jwt.ts           # Configuration JWT
  │   ├── models/              # Modèles Sequelize/TypeORM
  │   │   ├── User.ts
  │   │   ├── Product.ts
  │   │   ├── Order.ts
  │   │   └── Stock.ts
  │   ├── routes/              # Routes API
  │   │   ├── auth.ts
  │   │   ├── users.ts
  │   │   ├── products.ts
  │   │   ├── orders.ts
  │   │   └── stock.ts
  │   ├── controllers/         # Logique métier
  │   ├── middleware/          # Auth middleware, validation
  │   ├── utils/               # Helpers
  │   └── server.ts            # Point d'entrée
  ├── migrations/              # Migrations SQL
  ├── package.json
  └── tsconfig.json
  ```

### 2. Base de données MySQL

#### Tables à créer :

**users**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role ENUM('manager', 'client') NOT NULL,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone_number),
  INDEX idx_role (role)
);
```

**products**
```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category ENUM('food', 'drink', 'service') NOT NULL,
  type VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  has_stock BOOLEAN DEFAULT FALSE,
  stock_quantity INT,
  unit VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_active (is_active)
);
```

**orders**
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  payment_method ENUM('cash', 'card', 'mobile'),
  table_number VARCHAR(50),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_client (client_id),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at)
);
```

**order_items**
```sql
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order (order_id)
);
```

**stock**
```sql
CREATE TABLE stock (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT UNIQUE NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  INDEX idx_product (product_id)
);
```

**stock_movements**
```sql
CREATE TABLE stock_movements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  type ENUM('sale', 'restock', 'adjustment') NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  order_id INT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_product (product_id),
  INDEX idx_created_at (created_at)
);
```

### 3. Modifications dans shared/

**shared/src/api/**
- Remplacer `firebase/` par `api/`
- Créer un client API REST
- Services pour chaque entité (users, products, orders, stock)

**shared/src/api/client.ts**
```typescript
// Client API REST avec axios ou fetch
export class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  setToken(token: string) { ... }
  async get(endpoint: string) { ... }
  async post(endpoint: string, data: any) { ... }
  async put(endpoint: string, data: any) { ... }
  async delete(endpoint: string) { ... }
}
```

**shared/src/api/auth.ts**
```typescript
// Remplacer Firebase Auth par API REST
export const signUpWithPhoneAndPassword = async (...) => {
  const response = await apiClient.post('/auth/signup', {...});
  return response.data;
};

export const signInWithPhoneAndPassword = async (...) => {
  const response = await apiClient.post('/auth/login', {...});
  apiClient.setToken(response.data.token);
  return response.data.user;
};
```

### 4. Modifications dans les apps

**apps/manager/src/contexts/AuthContext.tsx**
- Remplacer Firebase Auth par API REST
- Gérer le token JWT dans localStorage
- Intercepter les requêtes pour ajouter le token

**apps/client/src/contexts/AuthContext.tsx**
- Même modifications

**Tous les écrans**
- Remplacer les appels Firebase par des appels API REST
- Gérer les erreurs HTTP
- Gérer le loading state

## Étapes de migration

### Phase 1 : Setup Backend
1. ✅ Créer la structure du backend
2. ✅ Configurer MySQL
3. ✅ Créer les modèles Sequelize/TypeORM
4. ✅ Créer les migrations SQL
5. ✅ Configurer Express + TypeScript

### Phase 2 : API Authentication
1. ✅ Créer les routes d'authentification
2. ✅ Implémenter JWT
3. ✅ Hashage des mots de passe (bcrypt)
4. ✅ Middleware d'authentification

### Phase 3 : API CRUD
1. ✅ Routes Users
2. ✅ Routes Products
3. ✅ Routes Orders
4. ✅ Routes Stock

### Phase 4 : Migration shared/
1. ✅ Créer le client API
2. ✅ Remplacer Firebase Auth par API Auth
3. ✅ Remplacer Firestore par API REST
4. ✅ Mettre à jour les types si nécessaire

### Phase 5 : Migration Apps
1. ✅ Mettre à jour AuthContext (manager)
2. ✅ Mettre à jour AuthContext (client)
3. ✅ Mettre à jour tous les écrans
4. ✅ Tester toutes les fonctionnalités

### Phase 6 : Tests & Déploiement
1. ✅ Tests d'intégration
2. ✅ Tests de performance
3. ✅ Déploiement backend
4. ✅ Déploiement apps

## Avantages de MySQL

✅ **Contrôle total** : Base de données relationnelle classique
✅ **Performance** : Requêtes SQL optimisées
✅ **Transactions** : Support natif des transactions ACID
✅ **Pas de dépendance Firebase** : Solution autonome
✅ **Coûts** : Potentiellement moins cher à grande échelle
✅ **Requêtes complexes** : JOINs, agrégations faciles

## Inconvénients à considérer

⚠️ **Complexité** : Plus de code à maintenir (backend + DB)
⚠️ **Déploiement** : Nécessite un serveur pour l'API
⚠️ **Scalabilité** : Gestion manuelle de la scalabilité
⚠️ **Temps de développement** : Plus long que Firebase

## Technologies recommandées

- **Backend** : Node.js + Express + TypeScript
- **ORM** : Sequelize ou TypeORM
- **Auth** : jsonwebtoken + bcrypt
- **Validation** : Joi ou Zod
- **API Client** : Axios ou fetch natif
- **MySQL** : MySQL 8.0+ ou MariaDB

## Estimation

- **Backend API** : 2-3 jours
- **Migration shared/** : 1 jour
- **Migration apps** : 2 jours
- **Tests** : 1 jour
- **Total** : ~6-7 jours de développement

## Questions à clarifier

1. Où héberger le backend API ? (VPS, Cloud, local)
2. Où héberger MySQL ? (Local, Cloud SQL, VPS)
3. Préférence ORM ? (Sequelize vs TypeORM)
4. Gestion des fichiers/images ? (Local storage, S3, autre)
