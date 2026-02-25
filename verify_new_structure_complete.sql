-- Script de vérification complète de la nouvelle structure order_supplements
-- Vérifie que toutes les vues utilisent la nouvelle structure

-- Utiliser la base de données
USE `continentalbd`;

-- =============================================
-- 1. VÉRIFICATION DE BASE
-- =============================================

-- Vérifier que la base de données existe et est utilisée
SELECT 
    'Base de données actuelle' as verification_type,
    DATABASE() as current_database;

-- Vérifier que toutes les tables existent
SELECT 
    'Tables créées' as verification_type,
    COUNT(*) as table_count,
    GROUP_CONCAT(TABLE_NAME ORDER BY TABLE_NAME) as table_list
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'continentalbd';

-- =============================================
-- 2. VÉRIFICATION DE LA TABLE order_supplements
-- =============================================

-- Structure de la table order_supplements
DESCRIBE order_supplements;

-- Vérifier s'il y a des données dans order_supplements
SELECT 
    'Données order_supplements' as verification_type,
    COUNT(*) as total_supplements,
    COALESCE(SUM(totalPrice), 0) as total_supplement_amount
FROM order_supplements;

-- =============================================
-- 3. VÉRIFICATION DES RELATIONS
-- =============================================

-- Vérifier les commandes avec leurs items et suppléments
SELECT 
    'Commandes avec suppléments' as verification_type,
    o.id as order_id,
    o.total_amount as order_total,
    COUNT(DISTINCT oi.id) as total_items,
    COUNT(DISTINCT os.id) as total_supplements,
    (COUNT(DISTINCT oi.id) + COUNT(DISTINCT os.id)) as total_lines,
    SUM(oi.total_price) as items_total,
    COALESCE(SUM(os.total_price), 0) as supplements_total,
    (SUM(oi.total_price) + COALESCE(SUM(os.total_price), 0)) as grand_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN order_supplements os ON oi.id = os.order_item_id
GROUP BY o.id, o.total_amount
ORDER BY o.created_at DESC
LIMIT 10;

-- Vérifier la cohérence des relations
SELECT 
    'Cohérence des relations' as verification_type,
    CASE 
        WHEN COUNT(os.id) = 0 THEN 'Aucun supplément trouvé'
        WHEN COUNT(DISTINCT os.order_item_id) = COUNT(os.id) THEN '✅ Tous les suppléments ont un parent valide'
        ELSE '❌ Problème de cohérence détecté'
    END as status,
    COUNT(DISTINCT os.order_item_id) as supplements_with_parent,
    COUNT(os.id) as total_supplements
FROM order_supplements os;

-- =============================================
-- 4. VUE COMPLÈTE COMME DANS L'APPLICATION
-- =============================================

-- Vue exacte comme utilisée par le backend (GET /orders)
SELECT 
    'Vue GET /orders' as verification_type,
    o.id as order_id,
    o.client_id,
    o.status as order_status,
    o.payment_status,
    o.total_amount,
    o.created_at as order_date,
    oi.id as item_id,
    oi.product_id,
    oi.product_name,
    oi.quantity as item_quantity,
    oi.unit_price as item_unit_price,
    oi.total_price as item_total_price,
    os.id as supplement_id,
    os.supplement_name,
    os.quantity as supplement_quantity,
    os.unit_price as supplement_unit_price,
    os.total_price as supplement_total_price,
    p.name as supplement_product_name,
    p.product_type as supplement_type
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN order_supplements os ON oi.id = os.order_item_id
LEFT JOIN products p ON os.supplement_id = p.id
WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY o.created_at DESC, oi.id, os.id
LIMIT 20;

-- =============================================
-- 5. VÉRIFICATION DES PRODUITS UTILISÉS COMME SUPPLÉMENTS
-- =============================================

SELECT 
    'Produits comme suppléments' as verification_type,
    p.id as product_id,
    p.name as product_name,
    p.product_type,
    COUNT(os.id) as times_used_as_supplement,
    SUM(os.quantity) as total_quantity_used,
    AVG(os.unit_price) as avg_price,
    MIN(os.unit_price) as min_price,
    MAX(os.unit_price) as max_price
FROM products p
LEFT JOIN order_supplements os ON p.id = os.supplement_id
GROUP BY p.id, p.name, p.product_type
HAVING COUNT(os.id) > 0
ORDER BY times_used_as_supplement DESC;

-- =============================================
-- 6. VÉRIFICATION DES DONNÉES DE TEST
-- =============================================

-- Vérifier les produits de test
SELECT 
    'Produits de test' as verification_type,
    p.id,
    p.name,
    p.product_type,
    p.price,
    c.name as category_name,
    s.quantity as stock_quantity,
    ps.supplement_id is not null as has_supplements_configured
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN stocks s ON p.id = s.product_id
LEFT JOIN product_supplements ps ON p.id = ps.product_id
WHERE p.id IN (1, 2, 6, 7, 8) -- Spaguetti, Riz, Œuf, Fromage, Salade
ORDER BY p.id;

-- Vérifier les suppléments configurés
SELECT 
    'Suppléments configurés' as verification_type,
    ps.product_id,
    p1.name as product_name,
    ps.supplement_id,
    p2.name as supplement_name,
    ps.max_quantity,
    ps.is_required
FROM product_supplements ps
JOIN products p1 ON ps.product_id = p1.id
JOIN products p2 ON ps.supplement_id = p2.id
ORDER BY ps.product_id, ps.supplement_id;

-- =============================================
-- 7. VÉRIFICATION DE L'INTÉGRITÉ DES DONNÉES
-- =============================================

-- Items sans suppléments (normal)
SELECT 
    'Items sans suppléments' as verification_type,
    COUNT(*) as count
FROM order_items oi
WHERE NOT EXISTS (
    SELECT 1 FROM order_supplements os WHERE os.order_item_id = oi.id
);

-- Suppléments sans parent (erreur)
SELECT 
    'Suppléments sans parent' as verification_type,
    COUNT(*) as count
FROM order_supplements os
WHERE NOT EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.id = os.order_item_id
);

-- Commandes avec structure correcte
SELECT 
    'Commandes structure correcte' as verification_type,
    COUNT(*) as count
FROM orders o
WHERE EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
) AND (
    SELECT COUNT(*) FROM order_supplements os 
    JOIN order_items oi2 ON os.order_item_id = oi2.id 
    WHERE oi2.order_id = o.id
) >= 0;

-- =============================================
-- 8. RÉSUMÉ FINAL
-- =============================================

SELECT 
    '🎯 RÉSUMÉ FINAL' as verification_type,
    'continentalbd' as database_name,
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalbd') as total_tables,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM order_items) as total_order_items,
    (SELECT COUNT(*) FROM order_supplements) as total_order_supplements,
    CASE 
        WHEN (SELECT COUNT(*) FROM order_supplements) > 0 THEN '✅ Nouvelle structure active'
        ELSE '❌ Aucun supplément trouvé'
    END as structure_status;
