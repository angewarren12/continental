-- Script complet de création de la base de données Continental
-- DROP et CREATE de toutes les tables avec la nouvelle structure order_supplements

-- Supprimer la base de données si elle existe
DROP DATABASE IF EXISTS `continentalbd`;

-- Créer la nouvelle base de données
CREATE DATABASE `continentalbd` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Utiliser la nouvelle base de données
USE `continentalbd`;

-- =============================================
-- TABLE DES UTILISATEURS
-- =============================================
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','manager','staff') NOT NULL DEFAULT 'staff',
  `phoneNumber` varchar(20) DEFAULT NULL,
  `totalSpent` int DEFAULT 0,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES CATÉGORIES
-- =============================================
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES PRODUITS
-- =============================================
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
  KEY `idx_products_available` (`isAvailable`),
  CONSTRAINT `fk_products_category_id` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES STOCKS
-- =============================================
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
  KEY `idx_stocks_quantity` (`quantity`),
  CONSTRAINT `fk_stocks_product_id` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stocks_updated_by` FOREIGN KEY (`updatedBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES MOUVEMENTS DE STOCK
-- =============================================
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
  KEY `idx_stock_movements_date` (`createdAt`),
  CONSTRAINT `fk_stock_movements_product_id` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stock_movements_order_id` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_stock_movements_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES COMMANDES
-- =============================================
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
  KEY `idx_orders_table` (`tableNumber`),
  CONSTRAINT `fk_orders_client_id` FOREIGN KEY (`clientId`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_orders_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES ITEMS DE COMMANDE
-- =============================================
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
  KEY `idx_order_items_product` (`productId`),
  CONSTRAINT `fk_order_items_order_id` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product_id` FOREIGN KEY (`productId`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES SUPPLÉMENTS DE COMMANDE (NOUVELLE STRUCTURE)
-- =============================================
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
  KEY `idx_order_supplements_supplement_id` (`supplementId`),
  CONSTRAINT `fk_order_supplements_order_id` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_supplements_order_item_id` FOREIGN KEY (`orderItemId`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_supplements_supplement_id` FOREIGN KEY (`supplementId`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES PAIEMENTS
-- =============================================
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
  KEY `idx_payments_date` (`createdAt`),
  CONSTRAINT `fk_payments_order_id` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES SUPPLÉMENTS DE PRODUITS
-- =============================================
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
  KEY `idx_product_supplements_supplement` (`supplementId`),
  CONSTRAINT `fk_product_supplements_product_id` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_supplements_supplement_id` FOREIGN KEY (`supplementId`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE DES SUPPLÉMENTS DE PLATS (LEGACY)
-- =============================================
CREATE TABLE `dish_supplements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dishId` int NOT NULL,
  `supplementId` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dish_supplements` (`dishId`,`supplementId`),
  KEY `idx_dish_supplements_dish` (`dishId`),
  KEY `idx_dish_supplements_supplement` (`supplementId`),
  CONSTRAINT `fk_dish_supplements_dish_id` FOREIGN KEY (`dishId`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dish_supplements_supplement_id` FOREIGN KEY (`supplementId`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- INSÉRER DES DONNÉES DE TEST
-- =============================================

-- Insérer des catégories
INSERT INTO `categories` (`name`, `description`) VALUES
('Plats principaux', 'Les plats principaux du restaurant'),
('Boissons', 'Toutes les boissons disponibles'),
('Desserts', 'Les desserts sucrés'),
('Accompagnements', 'Les accompagnements et suppléments');

-- Insérer des produits
INSERT INTO `products` (`name`, `description`, `price`, `productType`, `categoryId`) VALUES
('Spaguetti', 'Pâtes italiennes avec sauce tomate', 500, 'dish', 1),
('Riz', 'Riz blanc nature', 300, 'food', 4),
('Poulet grillé', 'Poulet grillé aux épices', 2000, 'food', 1),
('Coca Cola', 'Soda classique', 500, 'drink', 2),
('Jus d\'orange', 'Jus d\'orange frais', 400, 'drink', 2),
('Œuf', 'Œuf frais', 150, 'food', 4),
('Fromage', 'Fromage râpé', 200, 'food', 4),
('Salade verte', 'Salade fraîche', 300, 'food', 4);

-- Insérer des utilisateurs
INSERT INTO `users` (`name`, `email`, `password`, `role`, `phoneNumber`) VALUES
('Admin', 'admin@continental.com', '$2b$10$placeholder_hash', 'admin', '123456789'),
('Manager', 'manager@continental.com', '$2b$10$placeholder_hash', 'manager', '223344556'),
('Client Test', 'client@test.com', '$2b$10$placeholder_hash', 'staff', '334455667');

-- Insérer des stocks
INSERT INTO `stocks` (`productId`, `quantity`, `minQuantity`, `updatedBy`) VALUES
(1, 50, 10, 1), -- Spaguetti
(2, 100, 20, 1), -- Riz
(3, 30, 5, 1), -- Poulet
(4, 200, 50, 1), -- Coca Cola
(5, 150, 30, 1), -- Jus d'orange
(6, 100, 20, 1), -- Œuf
(7, 80, 15, 1), -- Fromage
(8, 60, 10, 1); -- Salade

-- Insérer des suppléments de produits
INSERT INTO `product_supplements` (`productId`, `supplementId`, `maxQuantity`, `isRequired`) VALUES
(1, 6, 3, 0), -- Spaguetti + Œuf
(1, 7, 2, 0), -- Spaguetti + Fromage
(1, 8, 1, 0), -- Spaguetti + Salade
(2, 6, 2, 0), -- Riz + Œuf
(2, 7, 1, 0); -- Riz + Fromage

-- =============================================
-- VÉRIFICATION
-- =============================================

-- Vérifier que toutes les tables sont créées
SELECT 
    TABLE_NAME as table_name,
    TABLE_ROWS as row_count,
    DATA_LENGTH as data_size
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'continentalbd'
ORDER BY TABLE_NAME;

-- Vérifier la structure de la nouvelle table order_supplements
DESCRIBE order_supplements;

-- Message de fin
SELECT 
    'Base de données Continental créée avec succès' as status,
    'continentalbd' as database_name,
    COUNT(*) as total_tables
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'continentalbd';
