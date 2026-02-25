-- Script de diagnostic des erreurs auth/controller
-- Identifie et corrige les problèmes de cohérence

USE `continentalbd`;

-- =============================================
-- 1. DIAGNOSTIC RAPIDE
-- =============================================

SELECT '🚨 DIAGNOSTIC DES ERREURS AUTH/CONTROLLER' as section_title;

-- Vérifier si la table users existe
SELECT 
    '📋 Table users:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users') > 0 
        THEN '✅ Table users existe'
        ELSE '❌ Table users manquante'
    END as status;

-- Vérifier les champs critiques
SELECT 
    '🔍 Champ phone_number:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        THEN '✅ phone_number existe'
        ELSE '❌ phone_number manquant'
    END as status;

SELECT 
    '🔍 Champ password_hash:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash') > 0 
        THEN '✅ password_hash existe'
        ELSE '❌ password_hash manquant'
    END as status;

SELECT 
    '🔍 Champ name:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'name') > 0 
        THEN '✅ name existe'
        ELSE '❌ name manquant'
    END as status;

SELECT 
    '🔍 Champ role:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role') > 0 
        THEN '✅ role existe'
        ELSE '❌ role manquant'
    END as status;

-- =============================================
-- 2. STRUCTURE COMPLÈTE DE LA TABLE USERS
-- =============================================

SELECT '📋 Structure actuelle de la table users:' as section_title;

SELECT 
    COLUMN_NAME as field_name,
    COLUMN_TYPE as field_type,
    IS_NULLABLE as nullable,
    COLUMN_DEFAULT as default_value,
    COLUMN_KEY as key_info
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- =============================================
-- 3. CORRECTIONS AUTOMATIQUES SI NÉCESSAIRES
-- =============================================

SELECT '🔧 Corrections automatiques:' as section_title;

-- Si phone_number n'existe pas mais que phoneNumber existe, le renommer
SELECT 
    '📝 Vérification phoneNumber → phone_number:' as correction_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phoneNumber') > 0 
        AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') = 0 
        THEN '⚠️ phoneNumber trouvé, phone_number manquant - Renommage nécessaire'
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phoneNumber') = 0 
        AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        THEN '✅ phone_number existe - Correct'
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phoneNumber') > 0 
        AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        THEN '⚠️ Les deux champs existent - Nettoyage nécessaire'
        ELSE '❌ Aucun champ phone trouvé'
    END as status;

-- Script de correction (décommenter pour exécuter)
/*
-- Renommer phoneNumber en phone_number si nécessaire
ALTER TABLE `users` 
CHANGE COLUMN `phoneNumber` `phone_number` varchar(20) DEFAULT NULL;

SELECT '✅ phoneNumber renommé en phone_number' as correction_result;
*/

-- Si password_hash n'existe pas mais que passwordHash existe, le renommer
SELECT 
    '📝 Vérification passwordHash → password_hash:' as correction_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'passwordHash') > 0 
        AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash') = 0 
        THEN '⚠️ passwordHash trouvé, password_hash manquant - Renommage nécessaire'
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'passwordHash') = 0 
        AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash') > 0 
        THEN '✅ password_hash existe - Correct'
        ELSE '❌ Aucun champ password trouvé'
    END as status;

-- Script de correction (décommenter pour exécuter)
/*
-- Renommer passwordHash en password_hash si nécessaire
ALTER TABLE `users` 
CHANGE COLUMN `passwordHash` `password_hash` varchar(255) NOT NULL;

SELECT '✅ passwordHash renommé en password_hash' as correction_result;
*/

-- =============================================
-- 4. TEST D'INSERTION POUR VÉRIFIER
-- =============================================

SELECT '🧪 Test d\'insertion (simulation controller):' as section_title;

-- Simulation de ce que le controller fait
-- (Décommenter pour tester)
/*
INSERT INTO `users` (
    name, 
    email, 
    password_hash, 
    role, 
    phone_number, 
    total_spent,
    created_at,
    updated_at
) VALUES (
    'Test Controller',
    'test@controller.com',
    'hashed_password_test',
    'staff',
    '0612345678',
    0,
    NOW(),
    NOW()
);

SELECT '✅ Insertion test réussie' as test_result;

-- Nettoyer le test
DELETE FROM users WHERE email = 'test@controller.com';
SELECT '🧹 Test nettoyé' as cleanup_result;
*/

-- =============================================
-- 5. ÉTAT FINAL
-- =============================================

SELECT '🎯 État final du diagnostic:' as section_title;

SELECT 
    '📊 Résumé final:' as diagnostic_type,
    CASE 
        WHEN (
            (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'name') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role') > 0
        ) 
        THEN '🎉 CONTROLLER PRÊT - Tous les champs requis existent'
        ELSE '❌ PROBLÈMES DÉTECTÉS - Corrections nécessaires'
    END as status;

-- Instructions de correction
SELECT 
    '📋 Instructions:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') = 0 
        THEN '1. Renommer phoneNumber en phone_number\n2. Relancer ce diagnostic'
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash') = 0 
        THEN '1. Renommer passwordHash en password_hash\n2. Relancer ce diagnostic'
        ELSE '✅ Configuration correcte - Prêt à tester l\'inscription'
    END as instructions;
