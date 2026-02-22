-- Script pour vérifier la structure de la table order_items
-- Note: Les order_items n'ont pas besoin de colonnes created_at/updated_at
-- Si elles existent, on peut les supprimer (optionnel)

USE continentalBd;

-- Vérifier la structure actuelle
DESCRIBE order_items;

-- Si vous avez des colonnes created_at ou updated_at que vous voulez supprimer (optionnel):
-- ALTER TABLE order_items DROP COLUMN IF EXISTS created_at;
-- ALTER TABLE order_items DROP COLUMN IF EXISTS updated_at;

SELECT 'Vérification de la table order_items terminée!' AS message;
