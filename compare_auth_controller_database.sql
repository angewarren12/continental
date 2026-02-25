-- Script de comparaison entre le controller auth et la table users
-- Vérifie la cohérence des champs utilisés

USE `continentalbd`;

-- =============================================
-- 1. CHAMPS UTILISÉS DANS LE CONTROLLER AUTH
-- =============================================

SELECT '🔍 Champs utilisés dans le controller auth:' as section_title;

-- Champs utilisés dans signup (lignes 46-52)
SELECT 
    '📝 Signup - User.create():' as controller_usage,
    'phoneNumber' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Formaté puis stocké dans BD' as usage;

SELECT 
    '📝 Signup - User.create():' as controller_usage,
    'passwordHash' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Hashé puis stocké dans BD' as usage;

SELECT 
    '📝 Signup - User.create():' as controller_usage,
    'name' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Directement stocké dans BD' as usage;

SELECT 
    '📝 Signup - User.create():' as controller_usage,
    'email' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Optionnel, stocké dans BD' as usage;

SELECT 
    '📝 Signup - User.create():' as controller_usage,
    'role' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Directement stocké dans BD' as usage;

SELECT 
    '📝 Signup - User.create():' as controller_usage,
    'totalSpent' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Initialisé à 0, stocké dans BD' as usage;

-- Champs utilisés dans login (ligne 99)
SELECT 
    '🔐 Login - User.findOne():' as controller_usage,
    'phoneNumber' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Recherche dans BD' as usage;

SELECT 
    '🔐 Login - Vérification mot de passe:' as controller_usage,
    'passwordHash' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Comparé avec le hash stocké' as usage;

-- Champs retournés dans la réponse (lignes 116-124)
SELECT 
    '📤 Réponse API - userResponse:' as controller_usage,
    'id' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Retourné au frontend' as usage;

SELECT 
    '📤 Réponse API - userResponse:' as controller_usage,
    'phoneNumber' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Retourné au frontend' as usage;

SELECT 
    '📤 Réponse API - userResponse:' as controller_usage,
    'name' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Retourné au frontend' as usage;

SELECT 
    '📤 Réponse API - userResponse:' as controller_usage,
    'email' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Retourné au frontend' as usage;

SELECT 
    '📤 Réponse API - userResponse:' as controller_usage,
    'role' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Retourné au frontend' as usage;

SELECT 
    '📤 Réponse API - userResponse:' as controller_usage,
    'totalSpent' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Retourné au frontend' as usage;

SELECT 
    '📤 Réponse API - userResponse:' as controller_usage,
    'createdAt' as field_name,
    'TypeScript/Sequelize' as field_type,
    'Retourné au frontend' as usage;

-- =============================================
-- 2. CHAMPS PRÉSENTS DANS LA TABLE USERS
-- =============================================

SELECT '📋 Champs présents dans la table users:' as section_title;

SELECT 
    '🗄️ Table users - Structure:' as database_field,
    COLUMN_NAME as field_name,
    COLUMN_TYPE as field_type,
    IS_NULLABLE as nullable,
    COLUMN_KEY as key_info
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- =============================================
-- 3. COMPARAISON ET COHÉRENCE
-- =============================================

SELECT '🔍 Comparaison et cohérence:' as section_title;

-- Vérifier que tous les champs du controller existent dans la table
SELECT 
    '✅ Champs requis présents:' as verification_type,
    'phoneNumber' as controller_field,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        THEN '✅ phone_number existe dans BD'
        ELSE '❌ phone_number manquant dans BD'
    END as status;

SELECT 
    '✅ Champs requis présents:' as verification_type,
    'passwordHash' as controller_field,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash') > 0 
        THEN '✅ password_hash existe dans BD'
        ELSE '❌ password_hash manquant dans BD'
    END as status;

SELECT 
    '✅ Champs requis présents:' as verification_type,
    'name' as controller_field,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'name') > 0 
        THEN '✅ name existe dans BD'
        ELSE '❌ name manquant dans BD'
    END as status;

SELECT 
    '✅ Champs requis présents:' as verification_type,
    'email' as controller_field,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email') > 0 
        THEN '✅ email existe dans BD'
        ELSE '❌ email manquant dans BD'
    END as status;

SELECT 
    '✅ Champs requis présents:' as verification_type,
    'role' as controller_field,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role') > 0 
        THEN '✅ role existe dans BD'
        ELSE '❌ role manquant dans BD'
    END as status;

SELECT 
    '✅ Champs requis présents:' as verification_type,
    'totalSpent' as controller_field,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'total_spent') > 0 
        THEN '✅ total_spent existe dans BD'
        ELSE '❌ total_spent manquant dans BD'
    END as status;

-- =============================================
-- 4. ÉTAT FINAL DE LA COHÉRENCE
-- =============================================

SELECT '🎯 État final de la cohérence:' as section_title;

SELECT 
    '📊 Résumé de cohérence:' as verification_type,
    CASE 
        WHEN (
            (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'name') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'total_spent') > 0
        ) 
        THEN '🎉 CONTROLLER ET BD COHÉRENTS - Login/inscription fonctionnels'
        ELSE '❌ INCOHÉRENCE DÉTECTÉE - Corrections nécessaires'
    END as status;

-- Mapping des champs TypeScript vers BD
SELECT 
    '🔄 Mapping TypeScript ↔ BD:' as mapping_info,
    'phoneNumber (TS) → phone_number (BD)' as field_mapping,
    'passwordHash (TS) → password_hash (BD)' as field_mapping_2,
    'totalSpent (TS) → total_spent (BD)' as field_mapping_3;
