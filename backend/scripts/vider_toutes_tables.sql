-- Script pour vider toutes les tables de la base de données
-- ATTENTION : Ce script supprime TOUTES les données !
-- Utiliser uniquement en développement ou après backup

USE continentalBd;

-- Désactiver temporairement les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer toutes les tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS dish_supplements;
DROP TABLE IF EXISTS product_supplements;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Toutes les tables ont été supprimées avec succès!' AS message;
