-- Créer la nouvelle table order_supplements
CREATE TABLE IF NOT EXISTS `order_supplements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `order_item_id` int NOT NULL,
  `supplement_id` int NOT NULL,
  `supplement_name` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` int NOT NULL,
  `total_price` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_supplements_order_id` (`order_id`),
  KEY `idx_order_supplements_order_item_id` (`order_item_id`),
  KEY `idx_order_supplements_supplement_id` (`supplement_id`),
  CONSTRAINT `fk_order_supplements_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_supplements_order_item_id` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_supplements_supplement_id` FOREIGN KEY (`supplement_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration des données existantes depuis order_items vers order_supplements
INSERT INTO order_supplements (order_id, order_item_id, supplement_id, supplement_name, quantity, unit_price, total_price, created_at, updated_at)
SELECT 
    oi.order_id,
    oi.parent_item_id as order_item_id,
    oi.product_id as supplement_id,
    oi.product_name as supplement_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    NOW() as created_at,
    NOW() as updated_at
FROM order_items oi
WHERE oi.is_supplement = 1 
AND oi.parent_item_id IS NOT NULL;

-- Supprimer les anciens suppléments de order_items
DELETE FROM order_items WHERE is_supplement = 1;

-- Mettre à jour la structure de order_items pour supprimer les champs inutiles
ALTER TABLE order_items 
DROP COLUMN IF EXISTS parent_item_id,
DROP COLUMN IF EXISTS is_supplement;
