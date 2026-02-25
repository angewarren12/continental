-- Migration pour ajouter les types de produits, unités de stock/vente et gestion des suppléments

USE continentalBd;

-- Ajouter les nouvelles colonnes à la table products
ALTER TABLE products 
  ADD COLUMN product_type ENUM('dish', 'drink', 'cigarette', 'egg', 'supplement', 'service') DEFAULT 'drink' AFTER category,
  ADD COLUMN stock_unit ENUM('packet', 'unit', 'plate') NULL AFTER has_stock,
  ADD COLUMN sale_unit ENUM('packet', 'unit', 'plate') DEFAULT 'unit' AFTER stock_unit,
  ADD COLUMN conversion_factor INT NULL COMMENT 'Facteur de conversion: 20 pour cigarettes, 30 pour œufs' AFTER sale_unit,
  ADD COLUMN is_supplement BOOLEAN DEFAULT FALSE AFTER conversion_factor;

-- Mettre à jour les produits existants selon leur catégorie
UPDATE products SET product_type = 'drink' WHERE category = 'drink';
UPDATE products SET product_type = 'dish' WHERE category = 'food';
UPDATE products SET product_type = 'service' WHERE category = 'service';

-- Modifier la table stock pour gérer les différentes unités
ALTER TABLE stock
  ADD COLUMN quantity_packets INT DEFAULT 0 COMMENT 'Stock en paquets (pour cigarettes)' AFTER quantity,
  ADD COLUMN quantity_units INT DEFAULT 0 COMMENT 'Stock en unités individuelles (pour cigarettes/œufs)' AFTER quantity_packets,
  ADD COLUMN quantity_plates INT DEFAULT 0 COMMENT 'Stock en plaquettes (pour œufs)' AFTER quantity_units;

-- Migrer les données existantes vers les nouvelles colonnes
-- Pour les produits avec stock, copier quantity vers quantity_units
UPDATE stock SET quantity_units = quantity WHERE quantity > 0;

-- Créer la table product_supplements pour gérer les relations plats-suppléments
CREATE TABLE IF NOT EXISTS product_supplements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL COMMENT 'ID du plat',
  supplement_id INT NOT NULL COMMENT 'ID du supplément',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (supplement_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_supplement (product_id, supplement_id),
  INDEX idx_product (product_id),
  INDEX idx_supplement (supplement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modifier la table order_items pour gérer les suppléments
ALTER TABLE order_items
  ADD COLUMN parent_item_id INT NULL COMMENT 'Référence au plat parent si c\'est un supplément' AFTER product_id,
  ADD COLUMN is_supplement BOOLEAN DEFAULT FALSE AFTER parent_item_id,
  ADD FOREIGN KEY (parent_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  ADD INDEX idx_parent_item (parent_item_id);

SELECT 'Migration terminée: types de produits, unités de stock et suppléments ajoutés' AS message;
