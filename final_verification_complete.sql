-- Script de vérification finale complète
-- Vérifie que toute l'application est prête : order_supplements + phone_number

USE `continentalbd`;

-- =============================================
-- 1. VÉRIFICATION DE LA BASE DE DONNÉES
-- =============================================

SELECT '🎯 VÉRIFICATION FINALE COMPLÈTE' as section_title;

-- Vérifier que toutes les tables existent
SELECT 
    '📋 Tables créées:' as verification_type,
    COUNT(*) as total_tables,
    GROUP_CONCAT(TABLE_NAME ORDER BY TABLE_NAME SEPARATOR ', ') as table_list
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'continentalbd';

-- =============================================
-- 2. VÉRIFICATION DU CHAMP phone_number
-- =============================================

-- Vérifier le champ phone_number dans users
SELECT 
    '🔍 Champ phone_number:' as verification_type,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalbd' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'phone_number';

-- État du champ phone_number
SELECT 
    '📊 État phone_number:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        THEN '✅ phone_number existe - Inscription prête'
        ELSE '❌ phone_number manquant - Corriger nécessaire'
    END as status;

-- =============================================
-- 3. VÉRIFICATION DE order_supplements
-- =============================================

-- Vérifier que la table order_supplements existe
SELECT 
    '📋 Table order_supplements:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'order_supplements') > 0 
        THEN '✅ order_supplements existe'
        ELSE '❌ order_supplements manquante'
    END as status;

-- Structure de order_supplements
DESCRIBE order_supplements;

-- Données dans order_supplements
SELECT 
    '📊 Données order_supplements:' as verification_type,
    COUNT(*) as total_supplements,
    COALESCE(SUM(totalPrice), 0) as total_amount
FROM order_supplements;

-- =============================================
-- 4. VÉRIFICATION DES RELATIONS
-- =============================================

-- Vérifier les commandes avec leurs items et suppléments
SELECT 
    '🔗 Relations commandes:' as verification_type,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT oi.id) as total_items,
    COUNT(DISTINCT os.id) as total_supplements,
    CASE 
        WHEN COUNT(DISTINCT os.id) > 0 THEN '✅ Suppléments actifs'
        ELSE 'ℹ️ Aucun supplément (normal si nouvelle base)'
    END as supplements_status
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN order_supplements os ON oi.id = os.order_item_id;

-- =============================================
-- 5. VÉRIFICATION DES UTILISATEURS
-- =============================================

-- Utilisateurs existants
SELECT 
    '👥 Utilisateurs actuels:' as verification_type,
    COUNT(*) as total_users,
    GROUP_CONCAT(CONCAT(id, ':', name, ' (', phone_number, ')') ORDER BY id) as user_list
FROM users;

-- =============================================
-- 6. VÉRIFICATION DES PRODUITS
-- =============================================

-- Produits et catégories
SELECT 
    '🍽️ Produits disponibles:' as verification_type,
    COUNT(*) as total_products,
    COUNT(DISTINCT c.id) as total_categories,
    GROUP_CONCAT(DISTINCT c.name ORDER BY c.name) as categories
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Suppléments configurés
SELECT 
    '🔧 Suppléments configurés:' as verification_type,
    COUNT(*) as total_configurations,
    GROUP_CONCAT(CONCAT(p1.name, ' + ', p2.name) ORDER BY p1.name) as supplement_pairs
FROM product_supplements ps
JOIN products p1 ON ps.product_id = p1.id
JOIN products p2 ON ps.supplement_id = p2.id;

-- =============================================
-- 7. ÉTAT FINAL DE L'APPLICATION
-- =============================================

SELECT 
    '🎯 ÉTAT FINAL DE L\'APPLICATION' as section_title;

-- Résumé complet
SELECT 
    '📊 Résumé final:' as verification_type,
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalbd') as total_tables,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM order_items) as items_count,
    (SELECT COUNT(*) FROM order_supplements) as supplements_count;

-- État de préparation
SELECT 
    '✅ État de préparation:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        AND (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'order_supplements') > 0 
        THEN '🎉 APPLICATION PRÊTE - Inscription et suppléments fonctionnels'
        ELSE '❌ Configuration incomplète - Vérifications nécessaires'
    END as status;

-- Instructions suivantes
SELECT 
    '📋 Prochaines étapes:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        AND (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalbd' AND TABLE_NAME = 'order_supplements') > 0 
        THEN '1. Démarrer le backend (npm run dev)\n2. Démarrer le frontend (npm run dev)\n3. Tester l\'inscription\n4. Créer une commande avec suppléments'
        ELSE '1. Corriger les problèmes identifiés\n2. Relancer ce script de vérification'
    END as next_steps;
