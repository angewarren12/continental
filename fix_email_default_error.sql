-- Correction du champ email sans valeur par défaut
-- Résout l'erreur "email doesn't have a default value"

USE `continentalbd`;

-- =============================================
-- 1. DIAGNOSTIC DU CHAMP email
-- =============================================

SELECT '🚨 DIAGNOSTIC CHAMP email' as section_title;

-- Vérifier la configuration du champ email
SELECT 
    COLUMN_NAME as field_name,
    COLUMN_TYPE as field_type,
    IS_NULLABLE as nullable,
    COLUMN_DEFAULT as default_value,
    EXTRA as extra_info
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'email';

-- Diagnostic du problème
SELECT 
    '📋 Diagnostic du champ email:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL) 
        THEN '❌ email est NOT NULL sans default - CAUSE DE L\'ERREUR'
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND IS_NULLABLE = 'YES') 
        THEN '✅ email est nullable - Correct'
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND COLUMN_DEFAULT IS NOT NULL) 
        THEN '✅ email a une valeur par défaut - Correct'
        ELSE '⚠️ Configuration email inhabituelle'
    END as status;

-- =============================================
-- 2. VÉRIFICATION DU CONTROLLER AUTH
-- =============================================

SELECT '🔍 Comportement du controller auth:' as section_title;

-- Le controller envoie email: undefined si non fourni
SELECT 
    '📝 Controller signup - User.create():' as controller_behavior,
    'email: validatedData.email || undefined' as field_value,
    'undefined peut causer l\'erreur si email est NOT NULL' as explanation;

-- Le controller ne fournit pas de valeur par défaut
SELECT 
    '📝 Controller login - User.findOne():' as controller_behavior,
    'Recherche par phoneNumber uniquement' as field_usage,
    'email n\'est pas requis pour le login' as explanation;

-- =============================================
-- 3. CORRECTION DU CHAMP email
-- =============================================

SELECT '🔧 Correction du champ email:' as section_title;

-- Option 1: Rendre le champ email nullable (RECOMMANDÉ)
-- (Décommenter et exécuter)
/*
-- Rendre email nullable
ALTER TABLE `users` 
MODIFY COLUMN `email` varchar(255) DEFAULT NULL;

SELECT '✅ Email rendu nullable - PROBLÈME RÉSOLU' as correction_result;
*/

-- Option 2: Ajouter une valeur par défaut (alternative)
-- (Décommenter et exécuter si vous préférez)
/*
-- Ajouter une valeur par défaut
ALTER TABLE `users` 
MODIFY COLUMN `email` varchar(255) DEFAULT NULL;

SELECT '✅ Email avec valeur par défaut NULL - PROBLÈME RÉSOLU' as correction_result;
*/

-- =============================================
-- 4. VÉRIFICATION APRÈS CORRECTION
-- =============================================

SELECT '🔍 Vérification après correction:' as section_title;

-- Vérifier la nouvelle configuration
SELECT 
    '📋 Configuration email après correction:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND IS_NULLABLE = 'YES') 
        THEN '✅ email est maintenant nullable - Inscription fonctionnera'
        ELSE '❌ email toujours NOT NULL - Appliquer la correction'
    END as status;

-- =============================================
-- 5. TEST D'INSCRIPTION POUR VÉRIFIER
-- =============================================

SELECT '🧪 Test d\'inscription avec email NULL:' as section_title;

-- Simulation de l'inscription comme le fait le controller (email = undefined)
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
    'Test Email Null',
    NULL,  -- Simule email: undefined du controller
    'hashed_password_123',
    'staff',
    '0612345678',
    0,
    NOW(),
    NOW()
);

SELECT '✅ Insertion avec email NULL réussie' as test_result;

-- Nettoyer le test
DELETE FROM users WHERE name = 'Test Email Null';
SELECT '🧹 Test nettoyé' as cleanup_result;
*/

-- =============================================
-- 6. ÉTAT FINAL
-- =============================================

SELECT '🎯 État final de la correction:' as section_title;

SELECT 
    '📊 Résumé final:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND IS_NULLABLE = 'YES') 
        THEN '🎉 email CORRIGÉ - Inscription sans email fonctionnera'
        ELSE '❌ email toujours problématique - Appliquer la correction'
    END as status;

-- Instructions précises
SELECT 
    '📋 Instructions de correction:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND IS_NULLABLE = 'NO') 
        THEN '1. Décommenter et exécuter: ALTER TABLE `users` MODIFY COLUMN `email` varchar(255) DEFAULT NULL;\n2. Relancer ce script'
        ELSE '✅ email est correctement configuré - Prêt à tester l\'inscription'
    END as instructions;

-- Résumé des champs requis pour l'inscription
SELECT 
    '🔍 Champs requis vs optionnels:' as diagnostic_type,
    'phone_number (requis)' as field_1,
    'password_hash (requis)' as field_2,
    'name (requis)' as field_3,
    'email (optionnel, nullable)' as field_4,
    'role (requis)' as field_5,
    'total_spent (défaut 0)' as field_6;

-- Comportement attendu du controller
SELECT 
    '📝 Comportement attendu après correction:' as diagnostic_type,
    'email: validatedData.email || undefined' as input,
    'undefined → NULL dans la base de données' as storage,
    'Plus d\'erreur "doesn\'t have a default value"' as result;
