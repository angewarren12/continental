-- Script complet de vérification et correction du champ phone
-- Assure que le champ s'appelle bien phone_number dans la base de données

-- Utiliser la base de données
USE `continentalbd`;

-- 1. Vérifier la structure actuelle de la table users
SELECT '📋 Structure actuelle de la table users:' as info;
DESCRIBE users;

-- 2. Vérifier spécifiquement les champs avec "phone" dans le nom
SELECT 
    '🔍 Champs contenant "phone":' as info,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY,
    EXTRA
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME LIKE '%phone%'
ORDER BY COLUMN_NAME;

-- 3. Vérifier si phoneNumber existe et phone_number n'existe pas
SELECT 
    '📊 État des champs phone:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phoneNumber') > 0 
        AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') = 0 
        THEN '❌ phoneNumber existe mais phone_number manquant'
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phoneNumber') = 0 
        AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        THEN '✅ phone_number existe (correct)'
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phoneNumber') > 0 
        AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        THEN '⚠️ Les deux champs existent (problème)'
        ELSE '❌ Aucun champ phone trouvé'
    END as status;

-- 4. Si phoneNumber existe, le renommer en phone_number (décommenter pour exécuter)
/*
-- Renommer phoneNumber en phone_number
ALTER TABLE `users` 
CHANGE COLUMN `phoneNumber` `phone_number` varchar(20) DEFAULT NULL;

SELECT '✅ Champ phoneNumber renommé en phone_number' as result;
*/

-- 5. Si les deux champs existent, migrer les données et supprimer phoneNumber (décommenter pour exécuter)
/*
-- Migrer les données de phoneNumber vers phone_number si phone_number est NULL
UPDATE `users` 
SET phone_number = phoneNumber 
WHERE phone_number IS NULL AND phoneNumber IS NOT NULL;

-- Supprimer l'ancien champ phoneNumber
ALTER TABLE `users` 
DROP COLUMN `phoneNumber`;

SELECT '✅ Données migrées et champ phoneNumber supprimé' as result;
*/

-- 6. Vérifier le résultat final
/*
SELECT '📋 Structure finale de la table users:' as info;
DESCRIBE users;
*/

-- 7. Test d'insertion pour vérifier que phone_number fonctionne
/*
-- Test d'insertion
INSERT INTO `users` (name, email, password, role, phone_number, totalSpent) 
VALUES ('Test Phone', 'test@phone.com', 'password123', 'staff', '123456789', 0);

SELECT '🧪 Test insertion réussi:' as info;
SELECT id, name, email, phone_number, role FROM users WHERE email = 'test@phone.com';

-- Nettoyer le test
DELETE FROM users WHERE email = 'test@phone.com';
*/

-- 8. Afficher tous les utilisateurs avec leur phone_number pour vérification
SELECT 
    '👥 Utilisateurs actuels avec phone_number:' as info,
    id,
    name,
    email,
    phone_number,
    role,
    totalSpent
FROM users
ORDER BY id;

SELECT '✅ Vérification du champ phone terminée' as final_status;
