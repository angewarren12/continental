-- Script de migration sécurisé vers order_supplements

-- 1. Créer la nouvelle table sans contraintes d'abord
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
  KEY `idx_order_supplements_supplement_id` (`supplement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Nettoyer les données incohérentes dans order_items
DELETE FROM order_items 
WHERE is_supplement = 1 
AND (parent_item_id IS NULL OR parent_item_id NOT IN (
    SELECT id FROM order_items WHERE is_supplement = 0 OR is_supplement IS NULL
));

-- 3. Insérer les données migrées
INSERT INTO order_supplements (order_id, order_item_id, supplement_id, supplement_name, quantity, unit_price, total_price, created_at, updated_at)
SELECT 
    oi.order_id,
    oi.parent_item_id as order_item_id,
    oi.product_id as supplement_id,
    oi.product_name as supplement_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    COALESCE(oi.created_at, NOW()) as created_at,
    COALESCE(oi.updated_at, NOW()) as updated_at
FROM order_items oi
WHERE oi.is_supplement = 1 
AND oi.parent_item_id IS NOT NULL
AND oi.parent_item_id IN (SELECT id FROM order_items WHERE is_supplement = 0 OR is_supplement IS NULL);

-- 4. Ajouter les contraintes de clé étrangère maintenant
ALTER TABLE order_supplements 
ADD CONSTRAINT `fk_order_supplements_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

ALTER TABLE order_supplements 
ADD CONSTRAINT `fk_order_supplements_order_item_id` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE;

ALTER TABLE order_supplements 
ADD CONSTRAINT `fk_order_supplements_supplement_id` FOREIGN KEY (`supplement_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

-- 5. Supprimer les anciens suppléments de order_items
DELETE FROM order_items WHERE is_supplement = 1;

-- 6. Mettre à jour la structure de order_items (optionnel - garder pour compatibilité)
-- ALTER TABLE order_items 
-- DROP COLUMN IF EXISTS parent_item_id,
-- DROP COLUMN IF EXISTS is_supplement;

-- 7. Vérification
SELECT 'Migration terminée' as status, 
       (SELECT COUNT(*) FROM order_supplements) as supplements_migres,
       (SELECT COUNT(*) FROM order_items WHERE is_supplement = 1) as anciens_supplements_restants;
