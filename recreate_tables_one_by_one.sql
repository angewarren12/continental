-- Script de recréation des tables une par une
-- Base de données : continentalbd

-- Utiliser la base de données
USE `continentalbd`;

-- =============================================
-- 1. TABLE DES UTILISATEURS
-- =============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','manager','staff') NOT NULL DEFAULT 'staff',
  `phoneNumber` varchar(20) DEFAULT NULL,
  `totalSpent` int DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Table users créée avec succès' as status;

-- =============================================
-- 2. TABLE DES CATÉGORIES
-- =============================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Table categories créée avec succès' as status;

-- =============================================
-- 3. TABLE DES PRODUITS
-- =============================================
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` int NOT NULL,
  `productType` enum('food','drink','dish','service') NOT NULL,
  `categoryId` int DEFAULT NULL,
  `imageUrl` varchar(500) DEFAULT NULL,
  `isAvailable` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_products_name` (`name`),
  KEY `idx_products_type` (`productType`),
  KEY `idx_products_category` (`categoryId`),
  KEY `idx_products_available` (`isAvailable`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Table products créée avec succès' as status;

-- =============================================
-- 4. TABLE DES STOCKS
-- =============================================
DROP TABLE IF EXISTS `stocks`;
CREATE TABLE `stocks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productId` int NOT NULL,
  `quantity` int NOT NULL DEFAULT 0,
  `minQuantity` int NOT NULL DEFAULT 5,
  `updatedBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stocks_product_id` (`productId`),
  KEY `idx_stocks_quantity` (`quantity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Table stocks créée avec succès' as status;

-- =============================================
-- 5. TABLE DES MOUVEMENTS DE STOCK
-- =============================================
DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productId` int NOT NULL,
  `orderId` int DEFAULT NULL,
  `type` enum('in','out','adjustment') NOT NULL,
  `quantity` int NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stock_movements_product` (`productId`),
  KEY `idx_stock_movements_order` (`orderId`),
  KEY `idx_stock_movements_type` (`type`),
  KEY `idx_stock_movements_date` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Table stock_movements créée avec succès' as status;

-- =============================================
-- 6. TABLE DES COMMANDES
-- =============================================
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clientId` int NOT NULL,
  `totalAmount` int NOT NULL,
  `status` enum('pending','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
  `paymentStatus` enum('pending','partial','paid','refunded') NOT NULL DEFAULT 'pending',
  `tableNumber` varchar(10) DEFAULT NULL,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_orders_client` (`clientId`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_payment_status` (`paymentStatus`),
  KEY `idx_orders_date` (`createdAt`),
  KEY `idx_orders_table` (`tableNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Table orders créée avec succès' as status;

-- =============================================
-- 7. TABLE DES ITEMS DE COMMANDE
-- =============================================
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `productId` int NOT NULL,
  `productName` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  `unitPrice` int NOT NULL,
  `totalPrice` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`orderId`),
  KEY `idx_order_items_product` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Table order_items créée avec succès' as status;

-- =============================================
-- 8. TABLE DES SUPPLÉMENTS DE COMMANDE (NOUVELLE STRUCTURE)
-- =============================================
DROP TABLE IF EXISTS `order_supplements`;
CREATE TABLE `order_supplements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `orderItemId` int NOT NULL,
  `supplementId` int NOT NULL,
  `supplementName` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  `unitPrice` int NOT NULL,
  `totalPrice` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_supplements_order_id` (`orderId`),
  KEY `idx_order_supplements_order_item_id` (`orderItemId`),
  KEY `idx_order_supplements_supplement_id` (`supplementId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Table order_supplements créée avec succès' as status;

-- =============================================
-- 9. TABLE DES PAIEMENTS
-- =============================================
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `amount` int NOT NULL,
  `method` enum('cash','wave') NOT NULL,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payments_order` (`orderId`),
  KEY `idx_payments_method` (`method`),
  KEY `idx_payments_date` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Table payments créée avec succès' as status;

-- =============================================
-- 10. TABLE DES SUPPLÉMENTS DE PRODUITS
-- =============================================
DROP TABLE IF EXISTS `product_supplements`;
CREATE TABLE `product_supplements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productId` int NOT NULL,
  `supplementId` int NOT NULL,
  `maxQuantity` int NOT NULL DEFAULT 1,
  `isRequired` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_supplements` (`productId`,`supplementId`),
  KEY `idx_product_supplements_product` (`productId`),
  KEY `idx_product_supplements_supplement` (`supplementId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Table product_supplements créée avec succès' as status;

-- =============================================
-- 11. TABLE DES SUPPLÉMENTS DE PLATS (LEGACY)
-- =============================================
DROP TABLE IF EXISTS `dish_supplements`;
CREATE TABLE `dish_supplements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dishId` int NOT NULL,
  `supplementId` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dish_supplements` (`dishId`,`supplementId`),
  KEY `idx_dish_supplements_dish` (`dishId`),
  KEY `idx_dish_supplements_supplement` (`supplementId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Table dish_supplements créée avec succès' as status;

-- =============================================
-- AJOUT DES CONTRAINTES DE CLÉ ÉTRANGÈRE
-- =============================================

-- Contraintes pour products
ALTER TABLE `products` 
ADD CONSTRAINT `fk_products_category_id` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

SELECT '✅ Contraintes products ajoutées avec succès' as status;

-- Contraintes pour stocks
ALTER TABLE `stocks` 
ADD CONSTRAINT `fk_stocks_product_id` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

SELECT '✅ Contraintes stocks ajoutées avec succès' as status;

-- Contraintes pour stock_movements
ALTER TABLE `stock_movements` 
ADD CONSTRAINT `fk_stock_movements_product_id` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_stock_movements_order_id` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_stock_movements_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`);

SELECT '✅ Contraintes stock_movements ajoutées avec succès' as status;

-- Contraintes pour orders
ALTER TABLE `orders` 
ADD CONSTRAINT `fk_orders_client_id` FOREIGN KEY (`clientId`) REFERENCES `users` (`id`),
ADD CONSTRAINT `fk_orders_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`);

SELECT '✅ Contraintes orders ajoutées avec succès' as status;

-- Contraintes pour order_items
ALTER TABLE `order_items` 
ADD CONSTRAINT `fk_order_items_order_id` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_order_items_product_id` FOREIGN KEY (`productId`) REFERENCES `products` (`id`);

SELECT '✅ Contraintes order_items ajoutées avec succès' as status;

-- Contraintes pour order_supplements
ALTER TABLE `order_supplements` 
ADD CONSTRAINT `fk_order_supplements_order_id` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_order_supplements_order_item_id` FOREIGN KEY (`orderItemId`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_order_supplements_supplement_id` FOREIGN KEY (`supplementId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

SELECT '✅ Contraintes order_supplements ajoutées avec succès' as status;

-- Contraintes pour payments
ALTER TABLE `payments` 
ADD CONSTRAINT `fk_payments_order_id` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_payments_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`);

SELECT '✅ Contraintes payments ajoutées avec succès' as status;

-- Contraintes pour product_supplements
ALTER TABLE `product_supplements` 
ADD CONSTRAINT `fk_product_supplements_product_id` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_product_supplements_supplement_id` FOREIGN KEY (`supplementId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

SELECT '✅ Contraintes product_supplements ajoutées avec succès' as status;

-- Contraintes pour dish_supplements
ALTER TABLE `dish_supplements` 
ADD CONSTRAINT `fk_dish_supplements_dish_id` FOREIGN KEY (`dishId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `fk_dish_supplements_supplement_id` FOREIGN KEY (`supplementId`) REFERENCES `products` (`id`) ON DELETE CASCADE;

SELECT '✅ Contraintes dish_supplements ajoutées avec succès' as status;

-- =============================================
-- VÉRIFICATION FINALE
-- =============================================
SELECT 
    '🎉 Toutes les tables créées avec succès' as status,
    COUNT(*) as total_tables
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'continentalbd';

-- Afficher toutes les tables créées
SELECT 
    TABLE_NAME as table_name,
    TABLE_ROWS as row_count
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'continentalbd'
ORDER BY TABLE_NAME;
