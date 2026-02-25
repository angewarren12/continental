---
name: Refonte Backend et Frontend après Migration BD
overview: Mettre à jour tous les modèles, routes API, types TypeScript et écrans frontend pour correspondre à la nouvelle structure de base de données simplifiée (suppression des redondances, source unique de vérité).
todos: []
---

# Plan de Mise à Jour Backend et Frontend après Migration BD

## Objectif

Adapter tout le code (backend et frontend) à la nouvelle structure de base de données simplifiée selon le plan de refonte.

## Problèmes Identifiés

### Backend

1. **Modèle Product** : Utilise encore `category` (ENUM), `type`, `hasStock`, `stockQuantity`, `unit`, `isSupplement`
2. **Routes products** : Schémas Zod utilisent les champs obsolètes, utilise `DishSupplement` au lieu de `ProductSupplement` unifié
3. **Routes stock** : Référence `product.type` et `product.unit` qui n'existent plus
4. **Routes orders** : Peut utiliser des champs obsolètes lors de la déduction de stock

### Frontend

1. **Types Product** : Interfaces contiennent tous les champs obsolètes
2. **ProductsScreen** : Utilise `category`, `hasStock`, `stockQuantity`, `unit`
3. **StockScreen** : Utilise les mêmes champs obsolètes
4. **CreateOrderScreen** : Utilise `hasStock`, `stockQuantity`
5. **DashboardScreen** : Peut utiliser des champs obsolètes

## Plan d'Exécution

### Phase 1 : Mise à Jour Modèles Backend

#### 1.1 Modèle Product (`backend/src/models/Product.ts`)

- Supprimer de `ProductAttributes` : `category`, `type`, `hasStock`, `stockQuantity`, `unit`, `isSupplement`
- Garder uniquement : `categoryId`, `productType`, `stockUnit`, `saleUnit`, `conversionFactor`
- Mettre à jour `Product.init()` pour supprimer les champs correspondants
- Ajouter méthode virtuelle `hasStock` qui vérifie l'existence dans la table `stock`

#### 1.2 Modèle ProductSupplement (`backend/src/models/ProductSupplement.ts`)

- Ajouter colonnes `supplement_name` et `supplement_price` au modèle
- Mettre à jour les interfaces pour supporter les suppléments intégrés
- Supprimer ou déprécier `DishSupplement` (garder temporairement pour migration)

#### 1.3 Modèle Stock

- Vérifier que le modèle est correct (déjà bon selon la structure cible)

### Phase 2 : Mise à Jour Routes Backend

#### 2.1 Routes Products (`backend/src/routes/products.ts`)

- **Schéma `createProductSchema`** :
- Supprimer : `category` (ENUM), `type`, `hasStock`, `stockQuantity`, `unit`, `isSupplement`
- Rendre `categoryId` obligatoire (au lieu de `category`)
- Rendre `productType` obligatoire
- Changer `supplements` pour utiliser `product_supplements` (supports intégrés et associations)
- **Schéma `updateProductSchema`** :
- Même nettoyage que `createProductSchema`
- **Route GET `/products`** :
- Supprimer filtre par `category` (ENUM), utiliser uniquement `categoryId`
- Remplacer `DishSupplement` par `ProductSupplement` dans les includes
- Filtrer par `categories.main_category` si besoin
- **Route POST `/products`** :
- Supprimer logique de création de stock dans `products` (utiliser uniquement table `stock`)
- Remplacer `DishSupplement.bulkCreate` par `ProductSupplement.bulkCreate` avec support intégrés
- Supprimer références à `hasStock`, `stockQuantity`, `unit`
- **Route PUT `/products/:id`** :
- Même logique que POST pour les suppléments
- Supprimer références aux champs obsolètes

#### 2.2 Routes Stock (`backend/src/routes/stock.ts`)

- **Route GET `/stock`** :
- Supprimer `'type'` et `'unit'` des `attributes` dans l'include Product
- Utiliser uniquement `productType`, `stockUnit`, `saleUnit`
- **Route GET `/stock/:productId`** :
- Supprimer `'type'` et `'unit'` des `attributes`
- **Route PUT `/stock/:productId`** :
- Vérifier qu'aucune référence aux champs obsolètes

#### 2.3 Routes Orders (`backend/src/routes/orders.ts`)

- Vérifier la logique de déduction de stock
- S'assurer qu'elle utilise uniquement la table `stock` (pas `products.stockQuantity`)
- Vérifier les filtres par `productType` (pas `type`)

### Phase 3 : Mise à Jour Types TypeScript

#### 3.1 Types Product (`shared/src/types/product.ts`)

- **Interface `Product`** :
- Supprimer : `category` (ENUM), `type`, `hasStock`, `stockQuantity`, `unit`, `isSupplement`
- Garder : `categoryId`, `productType`, `stockUnit`, `saleUnit`, `conversionFactor`
- Ajouter méthode virtuelle ou getter pour `hasStock` (basé sur existence dans stock)
- **Interface `ProductCreateInput`** :
- Même nettoyage que `Product`
- Rendre `categoryId` obligatoire
- Rendre `productType` obligatoire
- **Interface `ProductUpdateInput`** :
- Même nettoyage
- **Interface `DishSupplement`** :
- Renommer ou adapter pour `ProductSupplement` avec support intégré

#### 3.2 Types Category (`shared/src/types/category.ts`)

- Vérifier que `mainCategory` est bien présent

### Phase 4 : Mise à Jour API Frontend

#### 4.1 API Products (`shared/src/api/products.ts`)

- Mettre à jour `getProducts` pour utiliser `mainCategory` au lieu de `category` (ENUM)
- Vérifier que les types correspondent aux nouvelles interfaces

#### 4.2 API Stock (`shared/src/api/stock.ts`)

- Vérifier que les types sont corrects

### Phase 5 : Mise à Jour Écrans Frontend Manager

#### 5.1 ProductsScreen (`apps/manager/src/screens/ProductsScreen.tsx`)

- **État `formData`** :
- Supprimer : `category` (ENUM), `type`, `hasStock`, `stockQuantity`, `unit`
- Utiliser : `categoryId`, `productType` uniquement
- **Fonction `loadProducts`** :
- Filtrer par `categoryDetail.mainCategory` au lieu de `category`
- Supprimer références à `hasStock`, `stockQuantity`
- **Fonction `handleOpenDialog`** :
- Utiliser `categoryDetail.mainCategory` pour déterminer la catégorie
- Supprimer initialisation de `hasStock`, `stockQuantity`, `unit`
- **Fonction `handleSubmit`** :
- Supprimer envoi de `hasStock`, `stockQuantity`, `unit`
- Utiliser uniquement `categoryId` et `productType`
- **UI Formulaire** :
- Supprimer switch "Gérer le stock" (déduire de l'existence dans `stock`)
- Supprimer champs `stockQuantity` et `unit`
- Utiliser `categoryDetail.mainCategory` pour l'affichage

#### 5.2 StockScreen (`apps/manager/src/screens/StockScreen.tsx`)

- **Fonction `loadStocks`** :
- Vérifier que les produits récupérés n'utilisent pas `type` ou `unit`
- **Fonction `handleCreateProduct`** :
- Supprimer `hasStock`, `stockQuantity`, `unit` du formulaire
- Créer l'enregistrement `stock` séparément après création du produit
- **Affichage** :
- Utiliser `product.stockUnit` au lieu de `product.unit`

#### 5.3 CreateOrderScreen (`apps/manager/src/screens/CreateOrderScreen.tsx`)

- **Fonction `loadProducts`** :
- Supprimer mapping de `stockQuantity` et `hasStock` depuis `products`
- Utiliser uniquement les données de la table `stock`
- **Vérification stock** :
- Utiliser uniquement `stock.quantity` (pas `product.stockQuantity`)

#### 5.4 DashboardScreen (`apps/manager/src/screens/DashboardScreen.tsx`)

- Vérifier les calculs de `lowStock`
- Utiliser uniquement `stock.quantity` (pas `product.stockQuantity`)
- Utiliser `product.productType` au lieu de `product.type`

#### 5.5 Composants Suppléments

- **DishSupplementsManager** : Adapter pour utiliser `ProductSupplement` avec support intégré
- **SupplementSelector** : Vérifier qu'il utilise le bon système

### Phase 6 : Nettoyage et Tests

#### 6.1 Suppression Modèles Obsolètes

- Marquer `DishSupplement` comme déprécié
- Supprimer les imports inutilisés

#### 6.2 Tests

- Tester création produit avec/sans stock
- Tester création produit avec suppléments intégrés
- Tester filtrage par catégorie
- Tester gestion de stock
- Tester création de commande avec déduction de stock

## Fichiers à Modifier

### Backend

- `backend/src/models/Product.ts`
- `backend/src/models/ProductSupplement.ts`
- `backend/src/models/DishSupplement.ts` (déprécier)
- `backend/src/models/index.ts`
- `backend/src/routes/products.ts`
- `backend/src/routes/stock.ts`
- `backend/src/routes/orders.ts`

### Shared

- `shared/src/types/product.ts`
- `shared/src/types/category.ts`
- `shared/src/api/products.ts`

### Frontend Manager

- `apps/manager/src/screens/ProductsScreen.tsx`
- `apps/manager/src/screens/StockScreen.tsx`
- `apps/manager/src/screens/CreateOrderScreen.tsx`
- `apps/manager/src/screens/DashboardScreen.tsx`
- `apps/manager/src/components/products/DishSupplementsManager.tsx`
- `apps/manager/src/components/products/SupplementSelector.tsx`

## Points d'Attention

1. **Compatibilité** : S'assurer que les anciennes données migrées fonctionnent
2. **Stock** : Toujours vérifier l'existence dans la table `stock` (pas `hasStock`)
3. **Catégories** : Toujours utiliser `categoryDetail.mainCategory` pour la catégorie principale
4. **Suppléments** : Unifier dans `product_supplements` avec support des deux types
5. **Tests** : Tester chaque écran après modification