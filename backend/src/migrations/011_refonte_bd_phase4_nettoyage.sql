-- Migration Phase 4 : Nettoyage des champs obsolètes
-- Supprime type, is_supplement de products
-- Supprime table dish_supplements (après migration)
-- Date: 2026-02-24

USE continentalBd;

-- Étape 1 : Vérifier que product_type est rempli pour tous les produits
-- Mettre à jour product_type basé sur category si NULL
UPDATE products p
JOIN categories c ON p.category_id = c.id
SET p.product_type = 
  CASE 
    WHEN c.main_category = 'food' THEN 'dish'
    WHEN c.main_category = 'drink' THEN 'drink'
    WHEN c.main_category = 'service' THEN 'service'
    ELSE 'service'
  END
WHERE p.product_type IS NULL;

-- Étape 2 : Vérification
SELECT 
  'Vérification product_type' AS message,
  (SELECT COUNT(*) FROM products WHERE product_type IS NULL) AS products_without_product_type,
  (SELECT COUNT(*) FROM products WHERE product_type IS NOT NULL) AS products_with_product_type;

-- Étape 3 : Supprimer les colonnes obsolètes (COMMENTÉ - À DÉCOMMENTER APRÈS VALIDATION)
-- ALTER TABLE products 
--   DROP COLUMN type,
--   DROP COLUMN is_supplement;

-- Étape 4 : Supprimer la table dish_supplements (COMMENTÉ - À DÉCOMMENTER APRÈS VALIDATION)
-- DROP TABLE IF EXISTS dish_supplements;

-- NOTE: Décommenter les lignes ci-dessus seulement après validation complète des données
-- et après avoir vérifié que toutes les données de dish_supplements sont bien dans product_supplements
