-- Correction du champ phone dans la table users
-- Passage de phoneNumber à phone_number

-- Utiliser la base de données
USE `continentalbd`;

-- 1. Vérifier la structure actuelle
SELECT 'Structure actuelle de users:' as info;
DESCRIBE users;

-- 2. Vérifier si le champ phoneNumber existe
SELECT 
    'Vérification champ phoneNumber' as verification_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Champ phoneNumber trouvé'
        ELSE '❌ Champ phoneNumber non trouvé'
    END as status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'phoneNumber';

-- 3. Vérifier si le champ phone_number existe déjà
SELECT 
    'Vérification champ phone_number' as verification_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Champ phone_number déjà existe'
        ELSE '❌ Champ phone_number non trouvé'
    END as status
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'phone_number';

-- 4. Si phoneNumber existe et phone_number n'existe pas, faire la modification
-- (Décommenter pour exécuter)
/*
-- Renommer phoneNumber en phone_number
ALTER TABLE `users` 
CHANGE COLUMN `phoneNumber` `phone_number` varchar(20) DEFAULT NULL;
*/

-- 5. Vérifier le résultat après modification
/*
SELECT 'Structure après modification:' as info;
DESCRIBE users;
*/

-- 6. Vérifier tous les champs avec phone dans le nom
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME LIKE '%phone%'
ORDER BY COLUMN_NAME;

-- 7. Script de test pour l'inscription
-- Simuler une insertion pour vérifier que phone_number fonctionne
/*
INSERT INTO `users` (name, email, password, role, phone_number) 
VALUES ('Test User', 'test@example.com', 'password123', 'staff', '123456789');

SELECT 'Test insertion réussi:' as info;
SELECT id, name, email, phone_number FROM users WHERE email = 'test@example.com';

-- Nettoyer le test
DELETE FROM users WHERE email = 'test@example.com';
*/

SELECT '✅ Script de vérification du champ phone terminé' as status;
