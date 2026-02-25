-- Migration Phase 1 : Unification des suppléments
-- Migre dish_supplements vers product_supplements
-- Date: 2026-02-24

USE continentalBd;

-- Étape 1 : Vérifier que product_supplements existe et a les bonnes colonnes
-- Si les colonnes n'existent pas, les ajouter
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_supplements' AND COLUMN_NAME = 'supplement_name';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE product_supplements 
   ADD COLUMN supplement_name VARCHAR(255) NULL AFTER supplement_id,
   ADD COLUMN supplement_price INT NULL AFTER supplement_name',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Étape 2 : Migrer les données de dish_supplements vers product_supplements
INSERT INTO product_supplements (product_id, supplement_name, supplement_price, is_available, created_at, updated_at)
SELECT 
  dish_id AS product_id,
  name AS supplement_name,
  price AS supplement_price,
  TRUE AS is_available,
  created_at,
  updated_at
FROM dish_supplements
WHERE NOT EXISTS (
  SELECT 1 FROM product_supplements ps 
  WHERE ps.product_id = dish_supplements.dish_id 
  AND ps.supplement_name = dish_supplements.name
);

-- Étape 3 : Vérification - Compter les enregistrements migrés
SELECT 
  'Migration suppléments terminée' AS message,
  (SELECT COUNT(*) FROM dish_supplements) AS dish_supplements_count,
  (SELECT COUNT(*) FROM product_supplements WHERE supplement_name IS NOT NULL) AS product_supplements_integrated_count;

-- NOTE: Ne pas supprimer dish_supplements maintenant
-- Attendre validation des données avant suppression
