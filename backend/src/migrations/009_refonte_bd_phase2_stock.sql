-- Migration Phase 2 : Migration du stock depuis products vers stock
-- Supprime has_stock, stock_quantity, unit de products
-- Date: 2026-02-24

USE continentalBd;

-- Étape 1 : Migrer les données de stock depuis products vers stock
-- Créer les enregistrements stock pour les produits qui ont has_stock = TRUE
INSERT INTO stock (product_id, quantity, updated_by, last_updated)
SELECT 
  id AS product_id,
  COALESCE(stock_quantity, 0) AS quantity,
  1 AS updated_by,  -- Utilisateur système par défaut
  updated_at AS last_updated
FROM products
WHERE has_stock = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM stock s WHERE s.product_id = products.id
  )
ON DUPLICATE KEY UPDATE 
  quantity = products.stock_quantity,
  last_updated = products.updated_at;

-- Étape 2 : Vérification - Compter les enregistrements migrés
SELECT 
  'Migration stock terminée' AS message,
  (SELECT COUNT(*) FROM products WHERE has_stock = TRUE) AS products_with_stock,
  (SELECT COUNT(*) FROM stock) AS stock_records_count;

-- Étape 3 : Supprimer les colonnes obsolètes (COMMENTÉ - À DÉCOMMENTER APRÈS VALIDATION)
-- ALTER TABLE products 
--   DROP COLUMN has_stock,
--   DROP COLUMN stock_quantity,
--   DROP COLUMN unit;

-- NOTE: Décommenter les lignes ci-dessus seulement après validation complète des données
