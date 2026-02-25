-- Migration Phase 3 : Migration des catégories
-- Supprime products.category (ENUM) et utilise uniquement category_id
-- Date: 2026-02-24

USE continentalBd;

-- Étape 1 : S'assurer que toutes les catégories ont un main_category
UPDATE categories 
SET main_category = 'drink' 
WHERE main_category IS NULL AND id IN (SELECT DISTINCT category_id FROM products WHERE category = 'drink');

UPDATE categories 
SET main_category = 'food' 
WHERE main_category IS NULL AND id IN (SELECT DISTINCT category_id FROM products WHERE category = 'food');

UPDATE categories 
SET main_category = 'service' 
WHERE main_category IS NULL AND id IN (SELECT DISTINCT category_id FROM products WHERE category = 'service');

-- Étape 2 : Mettre à jour category_id pour les produits qui n'en ont pas
-- Basé sur la correspondance entre products.category et categories.main_category
UPDATE products p
SET category_id = (
  SELECT id FROM categories c 
  WHERE c.main_category = p.category 
  LIMIT 1
)
WHERE category_id IS NULL;

-- Étape 3 : Vérification - Compter les produits avec category_id
SELECT 
  'Migration catégories terminée' AS message,
  (SELECT COUNT(*) FROM products WHERE category_id IS NULL) AS products_without_category_id,
  (SELECT COUNT(*) FROM products WHERE category_id IS NOT NULL) AS products_with_category_id;

-- Étape 4 : Supprimer la colonne category (COMMENTÉ - À DÉCOMMENTER APRÈS VALIDATION)
-- ALTER TABLE products DROP COLUMN category;

-- NOTE: Décommenter la ligne ci-dessus seulement après validation complète des données
