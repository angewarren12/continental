-- Script simple de vérification du champ phone_number
-- Pour s'assurer que l'inscription fonctionne

USE `continentalbd`;

-- Vérifier la structure de la table users
SELECT '📋 Structure de la table users:' as info;
DESCRIBE users;

-- Vérifier spécifiquement le champ phone_number
SELECT 
    '🔍 Vérification du champ phone_number:' as verification_type,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'phone_number';

-- Si le champ s'appelle phoneNumber au lieu de phone_number, le corriger
-- (Décommenter et exécuter seulement si nécessaire)
/*
-- Renommer phoneNumber en phone_number
ALTER TABLE `users` 
CHANGE COLUMN `phoneNumber` `phone_number` varchar(20) DEFAULT NULL;

SELECT '✅ Champ renommé en phone_number' as result;
*/

-- Afficher les utilisateurs existants pour vérifier
SELECT 
    '👥 Utilisateurs actuels:' as info,
    id,
    name,
    email,
    phone_number,
    role
FROM users
ORDER BY id;

SELECT '✅ Vérification terminée - Le champ doit s\'appeler phone_number' as final_status;
