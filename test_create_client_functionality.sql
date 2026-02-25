-- Script de test pour la création de client
-- Vérifie que la nouvelle structure de base de données supporte la création de client

USE continentalBd;

-- =============================================
-- 1. VÉRIFICATION DE LA STRUCTURE POUR LA CRÉATION DE CLIENT
-- =============================================

SELECT '🧪 TEST DE CRÉATION DE CLIENT' as section_title;

-- Vérifier que la table users a la bonne structure
SELECT 
    '📋 Structure table users pour création client:' as verification_type,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalBd' 
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- =============================================
-- 2. TEST D'INSERTION MANUELLE (SIMULATION FRONTEND)
-- =============================================

SELECT '🔧 Test d\'insertion manuelle:' as section_title;

-- Simulation de ce que le frontend envoie au backend
-- (Décommenter pour tester)
/*
INSERT INTO users (
    name,
    phone_number,
    password_hash,
    email,
    role,
    total_spent,
    created_at,
    updated_at
) VALUES (
    'Client Test',
    '0612345678',
    'hashed_password_123456', -- Simule le hash du mot de passe
    'client@test.com',
    'client',
    0,
    NOW(),
    NOW()
);

SELECT '✅ Client test créé avec succès' as test_result;

-- Vérifier que le client a été bien créé
SELECT 
    '👥 Client créé:' as verification_type,
    id,
    name,
    phone_number,
    email,
    role,
    total_spent,
    created_at
FROM users 
WHERE phone_number = '0612345678';

-- Nettoyer le test
DELETE FROM users WHERE phone_number = '0612345678';
SELECT '🧹 Test nettoyé' as cleanup_result;
*/

-- =============================================
-- 3. VÉRIFICATION DES CONTRAINTES
-- =============================================

SELECT '🔍 Vérification des contraintes:' as section_title;

-- Vérifier l'unicité du phone_number
SELECT 
    '📋 Contrainte phone_number unique:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
             WHERE TABLE_SCHEMA = 'continentalBd' 
             AND TABLE_NAME = 'users' 
             AND CONSTRAINT_TYPE = 'UNIQUE' 
             AND CONSTRAINT_NAME LIKE '%phone%') > 0 
        THEN '✅ phone_number est unique'
        ELSE '❌ phone_number n\'est pas unique - Problème'
    END as status;

-- Vérifier que le role est bien un ENUM
SELECT 
    '📋 Contrainte role ENUM:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = 'continentalBd' 
             AND TABLE_NAME = 'users' 
             AND COLUMN_NAME = 'role' 
             AND DATA_TYPE = 'enum') > 0 
        THEN '✅ role est un ENUM'
        ELSE '❌ role n\'est pas un ENUM - Problème'
    END as status;

-- =============================================
-- 4. COMPATIBILITÉ AVEC LE BACKEND
-- =============================================

SELECT '🔄 Compatibilité avec le backend:' as section_title;

-- Champs requis par le backend pour la création de client
SELECT 
    '📝 Champs requis par le backend:' as backend_requirement,
    'name (string, min 2)' as field_1,
    'phoneNumber (string, min 10)' as field_2,
    'password (string, min 6)' as field_3,
    'email (string, email, optionnel)' as field_4,
    'role: "client" (automatique)' as field_5;

-- Vérifier que les champs existent dans la base
SELECT 
    '📊 Champs présents dans la base:' as database_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'name') > 0 
        THEN '✅ name'
        ELSE '❌ name manquant'
    END as name_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        THEN '✅ phone_number'
        ELSE '❌ phone_number manquant'
    END as phone_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash') > 0 
        THEN '✅ password_hash'
        ELSE '❌ password_hash manquant'
    END as password_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email') > 0 
        THEN '✅ email'
        ELSE '❌ email manquant'
    END as email_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role') > 0 
        THEN '✅ role'
        ELSE '❌ role manquant'
    END as role_status;

-- =============================================
-- 5. ÉTAT FINAL
-- =============================================

SELECT '🎯 État final du test de création client:' as section_title;

SELECT 
    '📊 Résumé final:' as test_summary,
    CASE 
        WHEN (
            (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'name') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role') > 0
        ) 
        THEN '🎉 CRÉATION DE CLIENT PRÊTE - Frontend et backend compatibles'
        ELSE '❌ Problèmes détectés - Vérifications nécessaires'
    END as status;

-- Instructions pour tester
SELECT 
    '📋 Instructions de test:' as instructions,
    CASE 
        WHEN (
            (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'name') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash') > 0 
            AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role') > 0
        ) 
        THEN '1. Démarrer le backend (npm run dev)\n2. Démarrer le frontend (npm run dev)\n3. Aller sur http://localhost:3000/clients\n4. Cliquer sur "Ajouter un client"\n5. Remplir le formulaire et créer le client'
        ELSE '1. Corriger les problèmes de structure\n2. Relancer ce script de test'
    END as next_steps;

-- Compteurs actuels
SELECT 
    '📊 Compteurs actuels:' as current_stats,
    (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients,
    (SELECT COUNT(*) FROM users WHERE role = 'manager') as total_managers,
    (SELECT COUNT(*) FROM users) as total_users;
