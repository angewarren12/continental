-- Script pour créer la base de données Continental
-- Exécuter ce script en premier avant les autres migrations

CREATE DATABASE IF NOT EXISTS continentalBd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE continentalBd;

-- Vérification que la base de données a été créée
SELECT 'Base de données continentalBd créée avec succès!' AS message;
