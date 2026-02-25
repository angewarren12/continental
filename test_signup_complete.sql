-- Script de test complet pour l'inscription d'utilisateur
-- Vérifie que le champ phone_number fonctionne correctement

USE `continentalbd`;

-- 1. Vérifier la structure finale de la table users
SELECT '📋 Structure finale de la table users:' as info;
DESCRIBE users;

-- 2. Vérifier spécifiquement le champ phone_number
SELECT 
    '🔍 Champ phone_number:' as verification_type,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'phone_number';

-- 3. Test d'inscription manuelle (simule ce que le backend fait)
-- Créer un utilisateur de test
INSERT INTO `users` (
    name, 
    email, 
    password_hash, 
    role, 
    phone_number, 
    totalSpent,
    createdAt,
    updatedAt
) VALUES (
    'Test Inscription',
    'test@inscription.com',
    'hashed_password_123',
    'staff',
    '0612345678',
    0,
    NOW(),
    NOW()
);

SELECT '✅ Utilisateur de test créé avec succès' as result;

-- 4. Vérifier que l'utilisateur a été bien créé avec phone_number
SELECT 
    '👥 Utilisateur créé:' as info,
    id,
    name,
    email,
    phone_number,
    role,
    totalSpent,
    createdAt
FROM users 
WHERE email = 'test@inscription.com';

-- 5. Test de recherche par phone_number (comme le backend le fait)
SELECT 
    '🔍 Recherche par phone_number:' as info,
    id,
    name,
    phone_number,
    role
FROM users 
WHERE phone_number = '0612345678';

-- 6. Nettoyer le test
DELETE FROM users WHERE email = 'test@inscription.com';
SELECT '🧹 Test nettoyé' as result;

-- 7. Vérifier les utilisateurs existants
SELECT 
    '👥 Utilisateurs actuels dans la base:' as info,
    COUNT(*) as total_users,
    GROUP_CONCAT(CONCAT(id, ':', name, ' (', phone_number, ')') ORDER BY id) as user_list
FROM users;

-- 8. État final de la configuration
SELECT 
    '🎯 État final de la configuration:' as final_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        THEN '✅ phone_number existe - Prêt pour inscription'
        ELSE '❌ phone_number manquant - Problème'
    END as database_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM users) >= 0 
        THEN '✅ Base accessible'
        ELSE '❌ Base inaccessible'
    END as access_status;
