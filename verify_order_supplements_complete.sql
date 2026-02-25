-- Vérification complète de la nouvelle table order_supplements

-- 1. Vérifier que la table existe et sa structure
SHOW TABLES LIKE 'order_supplements';
DESCRIBE order_supplements;

-- 2. Vérifier le nombre de suppléments migrés
SELECT 
    'Suppléments dans order_supplements' as type,
    COUNT(*) as count
FROM order_supplements

UNION ALL

SELECT 
    'Anciens suppléments dans order_items' as type,
    COUNT(*) as count
FROM order_items 
WHERE is_supplement = 1;

-- 3. Voir les suppléments avec leurs détails complets
SELECT 
    os.id,
    os.order_id,
    os.order_item_id,
    os.supplement_id,
    os.supplement_name,
    os.quantity,
    os.unit_price,
    os.total_price,
    os.created_at,
    oi.product_name as parent_item_name,
    p.name as supplement_product_name,
    p.product_type as supplement_type
FROM order_supplements os
LEFT JOIN order_items oi ON os.order_item_id = oi.id
LEFT JOIN products p ON os.supplement_id = p.id
ORDER BY os.order_id DESC, os.order_item_id, os.id;

-- 4. Vérifier les commandes récentes avec leurs suppléments
SELECT 
    o.id as order_id,
    o.total_amount,
    o.created_at as order_date,
    COUNT(DISTINCT oi.id) as total_items,
    COUNT(DISTINCT os.id) as total_supplements,
    SUM(oi.total_price) as items_total,
    SUM(os.total_price) as supplements_total,
    (SUM(oi.total_price) + COALESCE(SUM(os.total_price), 0)) as grand_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id AND (oi.is_supplement = 0 OR oi.is_supplement IS NULL)
LEFT JOIN order_supplements os ON oi.id = os.order_item_id
WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)
GROUP BY o.id, o.total_amount, o.created_at
ORDER BY o.created_at DESC
LIMIT 10;

-- 5. Vérifier la cohérence des données
SELECT 
    'Vérification de cohérence' as check_type,
    CASE 
        WHEN COUNT(os.id) = 0 THEN 'Aucun supplément trouvé'
        WHEN COUNT(DISTINCT os.order_item_id) = COUNT(os.id) THEN 'Tous les suppléments ont un parent valide'
        ELSE 'Problème de cohérence détecté'
    END as status
FROM order_supplements os

UNION ALL

SELECT 
    'Items sans suppléments' as check_type,
    COUNT(*) as count
FROM order_items oi
WHERE NOT EXISTS (
    SELECT 1 FROM order_supplements os WHERE os.order_item_id = oi.id
) AND (oi.is_supplement = 0 OR oi.is_supplement IS NULL)

UNION ALL

SELECT 
    'Suppléments sans parent' as check_type,
    COUNT(*) as count
FROM order_supplements os
WHERE NOT EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.id = os.order_item_id
);

-- 6. Tester une vue complète comme dans l'application
SELECT 
    o.id as order_id,
    o.client_id,
    o.status,
    o.payment_status,
    o.total_amount,
    o.created_at,
    oi.id as item_id,
    oi.product_id,
    oi.product_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    os.id as supplement_id,
    os.supplement_name,
    os.quantity as supplement_quantity,
    os.unit_price as supplement_unit_price,
    os.total_price as supplement_total_price
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id AND (oi.is_supplement = 0 OR oi.is_supplement IS NULL)
LEFT JOIN order_supplements os ON oi.id = os.order_item_id
WHERE o.id = (SELECT MAX(id) FROM orders)
ORDER BY oi.id, os.id;
