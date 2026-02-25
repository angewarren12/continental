-- Vérification et correction du champ phone dans la table users

-- Utiliser la base de données
USE `continentalbd`;

-- Vérifier la structure actuelle de la table users
DESCRIBE users;

-- Vérifier si le champ phone_number existe déjà
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME LIKE '%phone%';

-- Si le champ s'appelle phoneNumber, le renommer en phone_number
-- Vérifier d'abord si phoneNumber existe
SELECT 
    'Vérification champ phoneNumber' as verification_type,
    COUNT(*) as exists
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'phoneNumber';

-- Si phoneNumber existe, le renommer en phone_number
-- (Exécuter seulement si nécessaire)
/*
ALTER TABLE `users` 
CHANGE COLUMN `phoneNumber` `phone_number` varchar(20) DEFAULT NULL;
*/

-- Vérifier après modification
/*
DESCRIBE users;
*/

-- Vérifier tous les champs de la table users
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;
