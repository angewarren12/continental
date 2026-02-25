-- Script de vérification de la nouvelle structure de base de données
-- Vérifie la compatibilité avec l'application Continental

USE continentalBd;

-- =============================================
-- 1. VÉRIFICATION DES TABLES CRÉÉES
-- =============================================

SELECT '🎯 VÉRIFICATION DE LA NOUVELLE STRUCTURE' as section_title;

-- Vérifier que toutes les tables existent
SELECT 
    '📋 Tables créées:' as verification_type,
    COUNT(*) as total_tables,
    GROUP_CONCAT(TABLE_NAME ORDER BY TABLE_NAME SEPARATOR ', ') as table_list
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'continentalBd';

-- Tables attendues vs existantes
SELECT 
    '📊 Tables attendues:' as verification_type,
    'users, categories, products, stock, stock_movements, orders, order_items, payments, product_supplements' as expected_tables,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalBd') >= 9 
        THEN '✅ Toutes les tables présentes'
        ELSE '❌ Tables manquantes'
    END as status;

-- =============================================
-- 2. VÉRIFICATION DE LA TABLE USERS
-- =============================================

SELECT '👥 Vérification table users:' as section_title;

-- Structure de la table users
DESCRIBE users;

-- Vérifier les champs critiques pour l'authentification
SELECT 
    '🔍 Champs auth requis:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        THEN '✅ phone_number existe'
        ELSE '❌ phone_number manquant'
    END as phone_number_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash') > 0 
        THEN '✅ password_hash existe'
        ELSE '❌ password_hash manquant'
    END as password_hash_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email') > 0 
        THEN '✅ email existe'
        ELSE '❌ email manquant'
    END as email_status;

-- =============================================
-- 3. VÉRIFICATION DE LA TABLE PRODUCTS
-- =============================================

SELECT '🍽️ Vérification table products:' as section_title;

-- Structure de la table products
DESCRIBE products;

-- Vérifier les nouveaux champs
SELECT 
    '🔍 Nouveaux champs products:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'products' AND COLUMN_NAME = 'product_type') > 0 
        THEN '✅ product_type existe'
        ELSE '❌ product_type manquant'
    END as product_type_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'products' AND COLUMN_NAME = 'stock_unit') > 0 
        THEN '✅ stock_unit existe'
        ELSE '❌ stock_unit manquant'
    END as stock_unit_status;

-- =============================================
-- 4. VÉRIFICATION DE LA TABLE STOCK
-- =============================================

SELECT '📦 Vérification table stock:' as section_title;

-- Structure de la table stock
DESCRIBE stock;

-- Vérifier les champs de stock unifié
SELECT 
    '🔍 Champs stock unifié:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'stock' AND COLUMN_NAME = 'quantity_packets') > 0 
        THEN '✅ quantity_packets existe'
        ELSE '❌ quantity_packets manquant'
    END as packets_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'stock' AND COLUMN_NAME = 'quantity_units') > 0 
        THEN '✅ quantity_units existe'
        ELSE '❌ quantity_units manquant'
    END as units_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'stock' AND COLUMN_NAME = 'quantity_plates') > 0 
        THEN '✅ quantity_plates existe'
        ELSE '❌ quantity_plates manquant'
    END as plates_status;

-- =============================================
-- 5. VÉRIFICATION DE LA TABLE PRODUCT_SUPPLEMENTS
-- =============================================

SELECT '🔧 Vérification table product_supplements:' as section_title;

-- Structure de la table product_supplements
DESCRIBE product_supplements;

-- Vérifier le système unifié de suppléments
SELECT 
    '🔍 Système unifié de suppléments:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'product_supplements' AND COLUMN_NAME = 'supplement_product_id') > 0 
        THEN '✅ supplement_product_id existe'
        ELSE '❌ supplement_product_id manquant'
    END as supplement_product_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'product_supplements' AND COLUMN_NAME = 'supplement_name') > 0 
        THEN '✅ supplement_name existe'
        ELSE '❌ supplement_name manquant'
    END as supplement_name_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'product_supplements' AND COLUMN_NAME = 'supplement_price') > 0 
        THEN '✅ supplement_price existe'
        ELSE '❌ supplement_price manquant'
    END as supplement_price_status;

-- =============================================
-- 6. VÉRIFICATION DES DONNÉES INITIALES
-- =============================================

SELECT '📊 Vérification données initiales:' as section_title;

-- Catégories créées
SELECT 
    '🍺 Catégories créées:' as verification_type,
    COUNT(*) as total_categories,
    GROUP_CONCAT(name ORDER BY name) as category_list
FROM categories;

-- =============================================
-- 7. COMPATIBILITÉ AVEC L'APPLICATION
-- =============================================

SELECT '🔄 Compatibilité avec application:' as section_title;

-- Vérifier si la structure est compatible avec le backend actuel
SELECT 
    '📝 Backend compatibility:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalBd') >= 9 
        AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'products' AND COLUMN_NAME = 'product_type') > 0 
        THEN '✅ Structure compatible avec backend'
        ELSE '❌ Structure incompatible - Mises à jour nécessaires'
    END as compatibility_status;

-- Champs qui nécessitent des mises à jour dans le backend
SELECT 
    '⚠️ Backend updates needed:' as verification_type,
    'order_items.parent_item_id' as field_1,
    'order_items.is_supplement' as field_2,
    'product_supplements système unifié' as field_3,
    'stock.quantity_packets/units/plates' as field_4;

-- =============================================
-- 8. ÉTAT FINAL
-- =============================================

SELECT '🎯 ÉTAT FINAL DE LA NOUVELLE STRUCTURE' as section_title;

-- Résumé complet
SELECT 
    '📊 Résumé final:' as verification_type,
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalBd') as total_tables,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM users) as users_count;

-- État de préparation
SELECT 
    '✅ État de préparation:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalBd') >= 9 
        AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number') > 0 
        AND (SELECT COUNT(*) FROM categories) > 0 
        THEN '🎉 NOUVELLE STRUCTURE PRÊTE - Refonte réussie'
        ELSE '❌ Structure incomplète - Vérifications nécessaires'
    END as status;

-- Prochaines étapes
SELECT 
    '📋 Prochaines étapes:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalBd') >= 9 
        THEN '1. Mettre à jour les modèles Sequelize\n2. Adapter les routes\n3. Tester l\'application\n4. Migrer les données existantes'
        ELSE '1. Corriger les erreurs de structure\n2. Relancer ce script'
    END as next_steps;
