# Audit Complet de la Base de Données - Plan de Refonte

## 📊 État Actuel - Problèmes Identifiés

### 1. REDONDANCE STOCK (Critique)

**Problème :** Le stock est géré à deux endroits différents :
- **Table `products`** : `has_stock`, `stock_quantity`, `unit`
- **Table `stock`** : `quantity`, `quantity_packets`, `quantity_units`, `quantity_plates`

**Impact :**
- Risque d'incohérence entre les deux sources
- Logique complexe pour synchroniser
- Confusion sur quelle source utiliser

**Solution :** Supprimer les champs stock de `products`, utiliser uniquement la table `stock`

---

### 2. DEUX SYSTÈMES DE SUPPLÉMENTS (Critique)

**Problème :** Deux tables pour gérer les suppléments :
- **`dish_supplements`** : Suppléments intégrés (nom + prix directement dans le plat
- **`product_supplements`** : Association entre produits (produit A peut avoir produit B comme supplément)

**Impact :**
- Confusion sur quel système utiliser
- Logique dupliquée
- Maintenance difficile

**Solution :** Unifier en un seul système `product_supplements` avec option pour suppléments intégrés

---

### 3. REDONDANCE CATÉGORIES (Moyen)

**Problème :** Deux façons de catégoriser :
- **`products.category`** : ENUM('food', 'drink', 'service') - Catégorie principale
- **`products.category_id`** : FK vers `categories` - Sous-catégorie
- **`categories.main_category`** : ENUM('food', 'drink', 'service') - Redondant avec `products.category`

**Impact :**
- Risque d'incohérence (category='food' mais category_id pointe vers une catégorie 'drink')
- Logique complexe pour valider

**Solution :** Garder uniquement `category_id`, déduire la catégorie principale depuis `categories.main_category`

---

### 4. TYPE vs PRODUCT_TYPE (Moyen)

**Problème :** Deux champs pour le type :
- **`products.type`** : VARCHAR(50) - Ancien système (ex: 'spaghetti', 'beer', 'billiard_table')
- **`products.product_type`** : ENUM('dish', 'drink', 'cigarette', 'egg', 'supplement', 'service') - Nouveau système

**Impact :**
- Confusion sur quel champ utiliser
- `type` semble obsolète mais toujours utilisé

**Solution :** Supprimer `type`, utiliser uniquement `product_type`

---

### 5. CHAMPS OBSOLÈTES (Faible)

**Problème :** Champs qui ne sont plus utilisés ou redondants :
- `products.is_supplement` : Redondant avec `product_type = 'supplement'`
- `products.unit` : Redondant avec `stock.unit` ou `stock_unit`/`sale_unit`

**Solution :** Supprimer les champs obsolètes

---

## 🎯 Structure Cible - Source Unique de Vérité

### Table `products` (Simplifiée)

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,                    -- FK vers categories (supprime category ENUM)
  product_type ENUM('dish', 'drink', 'cigarette', 'egg', 'supplement', 'service') NOT NULL,
  image_url VARCHAR(500),
  description TEXT,
  price INT NOT NULL,
  stock_unit ENUM('packet', 'unit', 'plate'),  -- Unité pour le stock
  sale_unit ENUM('packet', 'unit', 'plate') DEFAULT 'unit',  -- Unité de vente
  conversion_factor INT,                        -- Facteur de conversion (ex: 20 cigarettes = 1 paquet)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_category_id (category_id),
  INDEX idx_product_type (product_type),
  INDEX idx_active (is_active)
);
```

**Champs supprimés :**
- ❌ `category` (ENUM) → Utiliser `categories.main_category` via `category_id`
- ❌ `type` (VARCHAR) → Remplacé par `product_type`
- ❌ `has_stock` → Déduire de l'existence d'un enregistrement dans `stock`
- ❌ `stock_quantity` → Utiliser `stock.quantity`
- ❌ `unit` → Utiliser `stock_unit`/`sale_unit`
- ❌ `is_supplement` → Utiliser `product_type = 'supplement'`

---

### Table `categories` (Améliorée)

```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  main_category ENUM('food', 'drink', 'service') NOT NULL,  -- Catégorie principale
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(7) DEFAULT '#bd0f3b',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_main_category (main_category),
  INDEX idx_active (is_active)
);
```

---

### Table `stock` (Source Unique)

```sql
CREATE TABLE stock (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL UNIQUE,
  quantity INT NOT NULL DEFAULT 0,              -- Quantité totale en unités de base
  quantity_packets INT DEFAULT 0,              -- Pour cigarettes (paquets)
  quantity_units INT DEFAULT 0,                -- Unités individuelles
  quantity_plates INT DEFAULT 0,               -- Pour œufs (plaquettes)
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_product_id (product_id)
);
```

**Note :** Seule source de vérité pour le stock. Si un produit n'a pas d'enregistrement dans `stock`, il n'a pas de stock géré.

---

### Table `product_supplements` (Unifiée)

```sql
CREATE TABLE product_supplements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,                     -- Le plat qui peut avoir des suppléments
  supplement_product_id INT NULL,              -- NULL = supplément intégré (nom/prix dans cette table)
  supplement_name VARCHAR(255) NULL,            -- Nom du supplément (si intégré)
  supplement_price INT NULL,                   -- Prix du supplément (si intégré)
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (supplement_product_id) REFERENCES products(id) ON DELETE CASCADE,
  CHECK (
    (supplement_product_id IS NOT NULL AND supplement_name IS NULL AND supplement_price IS NULL) OR
    (supplement_product_id IS NULL AND supplement_name IS NOT NULL AND supplement_price IS NOT NULL)
  ),
  UNIQUE (product_id, supplement_product_id),
  INDEX idx_product_id (product_id)
);
```

**Logique :**
- Si `supplement_product_id` est défini → Supplément = produit existant
- Si `supplement_name` et `supplement_price` sont définis → Supplément intégré (comme `dish_supplements` actuel)

**Avantage :** Un seul système pour gérer les deux types de suppléments

---

### Table `stock_movements` (Conservée)

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
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_product_id (product_id),
  INDEX idx_created_at (created_at)
);
```

**Conservée telle quelle** - Système d'audit fonctionnel

---

## 📋 Plan de Migration

### Phase 1 : Préparation (Sans impact)

1. ✅ Créer script de sauvegarde complète
2. ✅ Documenter toutes les données existantes
3. ✅ Créer scripts de migration réversibles

### Phase 2 : Migration Suppléments (Priorité 1)

1. Migrer `dish_supplements` vers `product_supplements`
   ```sql
   INSERT INTO product_supplements (product_id, supplement_name, supplement_price, is_available)
   SELECT dish_id, name, price, TRUE
   FROM dish_supplements;
   ```

2. Supprimer table `dish_supplements` après vérification

### Phase 3 : Migration Stock (Priorité 2)

1. Migrer `products.stock_quantity` vers `stock.quantity`
   ```sql
   INSERT INTO stock (product_id, quantity, updated_by)
   SELECT id, stock_quantity, 1
   FROM products
   WHERE has_stock = TRUE AND stock_quantity > 0
   ON DUPLICATE KEY UPDATE quantity = products.stock_quantity;
   ```

2. Supprimer champs `has_stock`, `stock_quantity`, `unit` de `products`

### Phase 4 : Migration Catégories (Priorité 3)

1. S'assurer que `categories.main_category` est rempli
2. Migrer `products.category` vers `products.category_id` basé sur `main_category`
3. Supprimer colonne `products.category` (ENUM)

### Phase 5 : Nettoyage (Priorité 4)

1. Supprimer `products.type` (remplacé par `product_type`)
2. Supprimer `products.is_supplement` (remplacé par `product_type = 'supplement'`)

### Phase 6 : Mise à jour Code (Parallèle)

1. Mettre à jour modèles Sequelize
2. Mettre à jour routes API
3. Mettre à jour frontend
4. Tests complets

---

## 🔄 Ordre d'Exécution Recommandé

1. **Migration Suppléments** (le plus simple, impact limité)
2. **Migration Stock** (critique pour cohérence)
3. **Migration Catégories** (simplification logique)
4. **Nettoyage** (suppression champs obsolètes)
5. **Mise à jour Code** (en parallèle des migrations)

---

## ⚠️ Points d'Attention

1. **Backup obligatoire** avant chaque migration
2. **Tests sur environnement de développement** d'abord
3. **Migration par étapes** avec vérifications entre chaque étape
4. **Rollback plan** pour chaque migration
5. **Communication** avec l'équipe sur les changements

---

## 📊 Bénéfices Attendus

1. ✅ **Source unique de vérité** pour le stock
2. ✅ **Un seul système** pour les suppléments
3. ✅ **Logique simplifiée** (moins de redondance)
4. ✅ **Maintenance facilitée** (moins de code à maintenir)
5. ✅ **Performance améliorée** (moins de jointures complexes)
6. ✅ **Cohérence garantie** (pas de risque de désynchronisation)

---

## 🎯 Prochaines Étapes

1. Valider ce plan avec l'équipe
2. Créer les scripts de migration détaillés
3. Tester sur environnement de développement
4. Exécuter en production avec monitoring
