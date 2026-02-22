-- Script pour exécuter la migration 002: Ajout des catégories et support des images
-- Exécuter ce script dans MySQL pour appliquer les modifications

USE continentalBd;

-- Créer la table categories
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(7) DEFAULT '#bd0f3b',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter les colonnes à la table products si elles n'existent pas déjà
-- Note: MySQL ne supporte pas IF NOT EXISTS pour ALTER TABLE, donc on vérifie d'abord
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'category_id';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE products ADD COLUMN category_id INT NULL AFTER category', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'image_url';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NULL AFTER type', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'description';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE products ADD COLUMN description TEXT NULL AFTER image_url', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter la clé étrangère pour category_id (si elle n'existe pas déjà)
-- Note: MySQL ne supporte pas IF NOT EXISTS pour les contraintes, donc on vérifie d'abord
SET @dbname = DATABASE();
SET @tablename = 'products';
SET @constraintname = 'fk_product_category';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (CONSTRAINT_NAME = @constraintname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD CONSTRAINT ', @constraintname, ' FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter un index sur category_id (si il n'existe pas déjà)
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND INDEX_NAME = 'idx_category_id';
SET @sql = IF(@index_exists = 0, 'CREATE INDEX idx_category_id ON products(category_id)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insérer les catégories par défaut
INSERT IGNORE INTO categories (name, description, icon, color, is_active) VALUES
('Bières', 'Bières locales et importées', 'LocalBar', '#bd0f3b', TRUE),
('Vins', 'Vins rouges, blancs et rosés', 'WineBar', '#8B0000', TRUE),
('Soft drinks', 'Boissons non alcoolisées', 'LocalDrink', '#FF6B6B', TRUE),
('Cocktails', 'Cocktails et boissons mixtes', 'SportsBar', '#bd0f3b', TRUE),
('Eaux', 'Eaux minérales et gazeuses', 'WaterDrop', '#2196F3', TRUE);

SELECT 'Migration 002 appliquée avec succès!' AS message;
