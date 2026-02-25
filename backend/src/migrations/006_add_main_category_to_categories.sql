-- Migration pour ajouter main_category à la table categories
-- Cette migration permet de lier les catégories à une catégorie principale (food, drink, service)

USE continentalBd;

-- Ajouter la colonne main_category
ALTER TABLE categories 
ADD COLUMN main_category ENUM('food', 'drink', 'service') NULL AFTER name;

-- Mettre à jour les catégories existantes pour les associer à 'drink' par défaut
-- (car actuellement toutes les catégories sont pour les boissons)
UPDATE categories 
SET main_category = 'drink' 
WHERE main_category IS NULL;

-- Rendre le champ obligatoire après la mise à jour
ALTER TABLE categories 
MODIFY COLUMN main_category ENUM('food', 'drink', 'service') NOT NULL;

-- Ajouter un index pour améliorer les performances
CREATE INDEX idx_main_category ON categories(main_category);

-- Créer les catégories principales par défaut si elles n'existent pas
-- Note: Ces catégories seront créées via l'interface ou le script d'initialisation
-- Ici on s'assure juste que la structure est prête
