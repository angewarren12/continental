-- Migration 002: Ajout des catégories et support des images pour les produits
-- Exécuter après 001_create_tables.sql

USE continentalBd;

-- Table categories
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

-- Ajouter les colonnes à la table products
ALTER TABLE products
ADD COLUMN category_id INT NULL AFTER category,
ADD COLUMN image_url VARCHAR(500) NULL AFTER type,
ADD COLUMN description TEXT NULL AFTER image_url;

-- Ajouter la clé étrangère pour category_id
ALTER TABLE products
ADD CONSTRAINT fk_product_category
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Ajouter un index sur category_id
ALTER TABLE products
ADD INDEX idx_category_id (category_id);
