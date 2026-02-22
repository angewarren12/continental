-- Script pour ajouter la colonne updated_at à la table orders
-- Si elle n'existe pas déjà

USE continentalBd;

-- Vérifier et ajouter updated_at si elle n'existe pas
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Vérifier la structure de la table
DESCRIBE orders;

SELECT 'Colonne updated_at ajoutée avec succès à la table orders!' AS message;
