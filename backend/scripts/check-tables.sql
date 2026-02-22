-- Script pour vérifier si toutes les tables existent et ont la bonne structure

USE continentalBd;

-- Vérifier l'existence des tables
SELECT 'Tables existantes:' AS info;
SHOW TABLES;

-- Vérifier la structure de chaque table
SELECT 'Structure de la table users:' AS info;
DESCRIBE users;

SELECT 'Structure de la table products:' AS info;
DESCRIBE products;

SELECT 'Structure de la table orders:' AS info;
DESCRIBE orders;

SELECT 'Structure de la table order_items:' AS info;
DESCRIBE order_items;

SELECT 'Structure de la table stock:' AS info;
DESCRIBE stock;

SELECT 'Structure de la table stock_movements:' AS info;
DESCRIBE stock_movements;
