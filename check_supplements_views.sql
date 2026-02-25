-- Vérifier la structure de la nouvelle table order_supplements
DESCRIBE order_supplements;

-- Vérifier s'il y a des données dans order_supplements
SELECT COUNT(*) as total_supplements FROM order_supplements;

-- Voir tous les suppléments avec leurs détails
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
    p.name as supplement_product_name
FROM order_supplements os
LEFT JOIN order_items oi ON os.order_item_id = oi.id
LEFT JOIN products p ON os.supplement_id = p.id
ORDER BY os.order_id, os.order_item_id;

-- Vérifier les commandes avec leurs items et suppléments
SELECT 
    o.id as order_id,
    o.created_at as order_date,
    oi.id as item_id,
    oi.product_name as item_name,
    oi.quantity as item_quantity,
    oi.unit_price as item_unit_price,
    oi.total_price as item_total_price,
    os.id as supplement_id,
    os.supplement_name,
    os.quantity as supplement_quantity,
    os.unit_price as supplement_unit_price,
    os.total_price as supplement_total_price
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN order_supplements os ON oi.id = os.order_item_id
WHERE o.id IN (
    SELECT DISTINCT order_id FROM order_supplements
    UNION
    SELECT DISTINCT id FROM orders ORDER BY created_at DESC LIMIT 10
)
ORDER BY o.id DESC, oi.id, os.id;

-- Vérifier les commandes récentes avec leurs suppléments
SELECT 
    o.id as order_id,
    o.total_amount as order_total,
    COUNT(DISTINCT oi.id) as total_items,
    COUNT(DISTINCT os.id) as total_supplements,
    SUM(CASE WHEN os.id IS NOT NULL THEN os.total_price ELSE 0 END) as supplements_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN order_supplements os ON oi.id = os.order_item_id
WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY o.id, o.total_amount
ORDER BY o.created_at DESC;

-- Vérifier la cohérence des données
SELECT 
    'order_items sans suppléments' as check_type,
    COUNT(*) as count
FROM order_items oi
WHERE NOT EXISTS (
    SELECT 1 FROM order_supplements os WHERE os.order_item_id = oi.id
)

UNION ALL

SELECT 
    'order_supplements sans order_item' as check_type,
    COUNT(*) as count
FROM order_supplements os
WHERE NOT EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.id = os.order_item_id
);

-- Vérifier les produits utilisés comme suppléments
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.product_type,
    COUNT(os.id) as times_used_as_supplement,
    SUM(os.quantity) as total_quantity_used,
    AVG(os.unit_price) as avg_price
FROM products p
LEFT JOIN order_supplements os ON p.id = os.supplement_id
GROUP BY p.id, p.name, p.product_type
HAVING COUNT(os.id) > 0
ORDER BY times_used_as_supplement DESC;
