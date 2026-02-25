-- Correction du champ total_spent manquant
-- Résout l'erreur "unknown total_spent" lors de l'inscription

USE `continentalbd`;

-- =============================================
-- 1. DIAGNOSTIC DU CHAMP total_spent
-- =============================================

SELECT '🚨 DIAGNOSTIC total_spent' as section_title;

-- Vérifier si total_spent existe
SELECT 
    '📋 Champ total_spent:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'total_spent') > 0 
        THEN '✅ total_spent existe'
        ELSE '❌ total_spent manquant - CAUSE DE L\'ERREUR'
    END as status;

-- Vérifier si totalSpent existe (camelCase)
SELECT 
    '📋 Champ totalSpent (camelCase):' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'totalSpent') > 0 
        THEN '⚠️ totalSpent existe (mauvais format)'
        ELSE '❌ totalSpent n\'existe pas'
    END as status;

-- =============================================
-- 2. STRUCTURE ACTUELLE DE LA TABLE USERS
-- =============================================

SELECT '📋 Structure actuelle de la table users:' as section_title;

SELECT 
    COLUMN_NAME as field_name,
    COLUMN_TYPE as field_type,
    IS_NULLABLE as nullable,
    COLUMN_DEFAULT as default_value
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- =============================================
-- 3. CORRECTION DU CHAMP total_spent
-- =============================================

SELECT '🔧 Correction du champ total_spent:' as section_title;

-- Si totalSpent existe, le renommer en total_spent
-- (Décommenter et exécuter si nécessaire)
/*
-- Renommer totalSpent en total_spent
ALTER TABLE `users` 
CHANGE COLUMN `totalSpent` `total_spent` int DEFAULT 0;

SELECT '✅ totalSpent renommé en total_spent' as correction_result;
*/

-- Si total_spent n'existe pas du tout, l'ajouter
-- (Décommenter et exécuter si nécessaire)
/*
-- Ajouter le champ total_spent
ALTER TABLE `users` 
ADD COLUMN `total_spent` int DEFAULT 0 AFTER `role`;

SELECT '✅ Champ total_spent ajouté' as correction_result;
*/

-- =============================================
-- 4. VÉRIFICATION APRÈS CORRECTION
-- =============================================

SELECT '🔍 Vérification après correction:' as section_title;

-- Vérifier que total_spent existe maintenant
SELECT 
    '📋 Champ total_spent (après correction):' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'total_spent') > 0 
        THEN '✅ total_spent existe maintenant - PROBLÈME RÉSOLU'
        ELSE '❌ total_spent toujours manquant - Exécuter la correction'
    END as status;

-- =============================================
-- 5. TEST D'INSCRIPTION POUR VÉRIFIER
-- =============================================

SELECT '🧪 Test d\'inscription (simulation):' as section_title;

-- Simulation de l'inscription comme le fait le controller
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
    'Test total_spent',
    'test@totalspent.com',
    'hashed_password_123',
    'staff',
    '0612345678',
    0,
    NOW(),
    NOW()
);

SELECT '✅ Insertion avec total_spent réussie' as test_result;

-- Nettoyer le test
DELETE FROM users WHERE email = 'test@totalspent.com';
SELECT '🧹 Test nettoyé' as cleanup_result;
*/

-- =============================================
-- 6. ÉTAT FINAL
-- =============================================

SELECT '🎯 État final de la correction:' as section_title;

SELECT 
    '📊 Résumé final:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'total_spent') > 0 
        THEN '🎉 total_spent CORRIGÉ - Inscription prête'
        ELSE '❌ total_spent toujours manquant - Appliquer la correction'
    END as status;

-- Instructions précises
SELECT 
    '📋 Instructions de correction:' as diagnostic_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'totalSpent') > 0 
        THEN '1. Décommenter et exécuter le renommage totalSpent → total_spent\n2. Relancer ce script'
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'total_spent') = 0 
        THEN '1. Décommenter et exécuter l\'ajout du champ total_spent\n2. Relancer ce script'
        ELSE '✅ total_spent existe - Prêt à tester l\'inscription'
    END as instructions;

-- Résumé des champs requis pour l'inscription
SELECT 
    '🔍 Champs requis pour inscription:' as diagnostic_type,
    'phone_number (formaté)' as field_1,
    'password_hash (hashé)' as field_2,
    'name (texte)' as field_3,
    'email (optionnel)' as field_4,
    'role (enum)' as field_5,
    'total_spent (défaut 0)' as field_6;
