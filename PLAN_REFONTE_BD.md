# Plan de Refonte Complète de la Base de Données

## 🎯 Objectif

Simplifier la base de données pour avoir **une seule source de vérité** et éliminer les redondances.

---

## 📊 Audit des Problèmes

### ❌ Problème 1 : Redondance Stock
- **Actuel :** Stock géré dans `products` (has_stock, stock_quantity, unit) ET dans `stock` (quantity, quantity_packets, etc.)
- **Impact :** Risque d'incohérence, logique complexe
- **Solution :** Supprimer champs stock de `products`, utiliser uniquement `stock`

### ❌ Problème 2 : Deux Systèmes de Suppléments
- **Actuel :** `dish_supplements` (intégrés) ET `product_supplements` (associations)
- **Impact :** Confusion, logique dupliquée
- **Solution :** Unifier dans `product_supplements` avec support des deux types

### ❌ Problème 3 : Redondance Catégories
- **Actuel :** `products.category` (ENUM) ET `products.category_id` (FK) ET `categories.main_category`
- **Impact :** Risque d'incohérence
- **Solution :** Utiliser uniquement `category_id`, déduire depuis `categories.main_category`

### ❌ Problème 4 : Type vs ProductType
- **Actuel :** `products.type` (VARCHAR) ET `products.product_type` (ENUM)
- **Impact :** Confusion
- **Solution :** Supprimer `type`, utiliser uniquement `product_type`

### ❌ Problème 5 : Champs Obsolètes
- **Actuel :** `is_supplement`, `unit` redondants
- **Impact :** Maintenance inutile
- **Solution :** Supprimer

---

## 🏗️ Structure Cible

### Table `products` (Simplifiée)

```sql
products
├── id
├── name
├── category_id (FK → categories)          -- UNIQUEMENT cette référence
├── product_type (ENUM)                     -- UNIQUEMENT ce champ pour le type
├── image_url
├── description
├── price
├── stock_unit                              -- Unité pour le stock
├── sale_unit                               -- Unité de vente
├── conversion_factor                       -- Facteur de conversion
├── is_active
└── timestamps

SUPPRIMÉ :
❌ category (ENUM) → Utiliser categories.main_category via category_id
❌ type (VARCHAR) → Remplacé par product_type
❌ has_stock → Déduire de l'existence dans stock
❌ stock_quantity → Utiliser stock.quantity
❌ unit → Utiliser stock_unit/sale_unit
❌ is_supplement → Utiliser product_type = 'supplement'
```

### Table `stock` (Source Unique)

```sql
stock
├── id
├── product_id (UNIQUE, FK → products)
├── quantity (quantité totale)
├── quantity_packets
├── quantity_units
├── quantity_plates
├── last_updated
└── updated_by

→ SEULE source de vérité pour le stock
→ Si pas d'enregistrement = pas de stock géré
```

### Table `product_supplements` (Unifiée)

```sql
product_supplements
├── id
├── product_id (FK → products)             -- Le plat
├── supplement_product_id (FK → products, NULL)  -- Produit existant comme supplément
├── supplement_name (VARCHAR, NULL)        -- Nom si intégré
├── supplement_price (INT, NULL)            -- Prix si intégré
├── is_available
└── timestamps

Logique :
- Si supplement_product_id IS NOT NULL → Supplément = produit existant
- Si supplement_name IS NOT NULL → Supplément intégré (comme dish_supplements)
- CHECK : Un seul des deux doit être défini
```

---

## 📋 Plan d'Exécution

### Phase 1 : Migration Suppléments ✅
**Fichier :** `008_refonte_bd_phase1_supplements.sql`
- Migrer `dish_supplements` → `product_supplements`
- Ajouter colonnes `supplement_name`, `supplement_price` à `product_supplements`
- **Ne PAS supprimer** `dish_supplements` immédiatement

### Phase 2 : Migration Stock ✅
**Fichier :** `009_refonte_bd_phase2_stock.sql`
- Migrer `products.stock_quantity` → `stock.quantity`
- Créer enregistrements `stock` pour produits avec `has_stock = TRUE`
- **Ne PAS supprimer** les colonnes immédiatement

### Phase 3 : Migration Catégories ✅
**Fichier :** `010_refonte_bd_phase3_categories.sql`
- S'assurer que `categories.main_category` est rempli
- Mettre à jour `products.category_id` basé sur `products.category`
- **Ne PAS supprimer** `products.category` immédiatement

### Phase 4 : Nettoyage ✅
**Fichier :** `011_refonte_bd_phase4_nettoyage.sql`
- Supprimer `products.type`
- Supprimer `products.is_supplement`
- Supprimer table `dish_supplements` (après validation)

### Phase 5 : Mise à jour Code
- Modèles Sequelize
- Routes API
- Frontend
- Tests

---

## ⚠️ Procédure de Migration

### Avant Migration
1. ✅ **Backup complet** de la base de données
2. ✅ Tester sur **environnement de développement**
3. ✅ Documenter l'état actuel

### Pendant Migration
1. Exécuter les migrations **une par une**
2. **Vérifier** les données après chaque migration
3. **Valider** avec l'équipe

### Après Migration
1. **Tests complets** de l'application
2. **Monitoring** des erreurs
3. **Rollback** si nécessaire

---

## 🔄 Ordre d'Exécution

```
1. Backup
   ↓
2. Phase 1 : Suppléments (impact limité)
   ↓
3. Phase 2 : Stock (critique)
   ↓
4. Phase 3 : Catégories (simplification)
   ↓
5. Phase 4 : Nettoyage (final)
   ↓
6. Mise à jour Code (parallèle)
   ↓
7. Tests & Validation
```

---

## 📝 Checklist de Validation

### Après Phase 1 (Suppléments)
- [ ] Tous les `dish_supplements` sont dans `product_supplements`
- [ ] Les suppléments s'affichent correctement dans l'interface
- [ ] Les suppléments peuvent être créés/modifiés

### Après Phase 2 (Stock)
- [ ] Tous les produits avec `has_stock = TRUE` ont un enregistrement dans `stock`
- [ ] Les quantités sont correctes
- [ ] La gestion de stock fonctionne

### Après Phase 3 (Catégories)
- [ ] Tous les produits ont un `category_id`
- [ ] Les filtres par catégorie fonctionnent
- [ ] Les produits s'affichent dans les bons onglets

### Après Phase 4 (Nettoyage)
- [ ] L'application fonctionne sans erreur
- [ ] Tous les tests passent
- [ ] Les performances sont bonnes

---

## 🚀 Prochaines Étapes

1. **Valider ce plan** avec l'équipe
2. **Créer l'environnement de test**
3. **Exécuter les migrations** une par une
4. **Mettre à jour le code** en parallèle
5. **Déployer en production** après validation complète
