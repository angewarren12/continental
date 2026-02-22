-- Script pour corriger les produits existants
-- 1. Créer les enregistrements de stock manquants pour les produits qui ont has_stock = 1
-- 2. Vérifier les catégories disponibles

USE continentalBd;

-- Étape 1: Vérifier les catégories disponibles
SELECT '=== CATÉGORIES DISPONIBLES ===' AS info;
SELECT * FROM categories ORDER BY id;

-- Étape 2: Vérifier les produits existants
SELECT '=== PRODUITS EXISTANTS ===' AS info;
SELECT 
    p.id,
    p.name,
    p.category,
    p.category_id,
    p.has_stock,
    p.stock_quantity,
    s.id AS stock_id,
    s.quantity AS stock_quantity_in_stock_table
FROM products p
LEFT JOIN stock s ON p.id = s.product_id
ORDER BY p.id;

-- Étape 3: Créer les stocks manquants pour les produits qui ont has_stock = 1
-- mais pas d'enregistrement dans la table stock
INSERT INTO stock (product_id, quantity, last_updated, updated_by)
SELECT 
    p.id AS product_id,
    COALESCE(p.stock_quantity, 0) AS quantity,
    NOW() AS last_updated,
    1 AS updated_by  -- ID de l'utilisateur manager (ajustez si nécessaire)
FROM products p
WHERE p.has_stock = 1
  AND p.id NOT IN (SELECT product_id FROM stock WHERE product_id IS NOT NULL);

-- Étape 4: Vérifier les résultats après correction
SELECT '=== RÉSULTATS APRÈS CORRECTION ===' AS info;
SELECT 
    p.id,
    p.name,
    p.has_stock,
    p.stock_quantity AS stock_quantity_in_product,
    s.id AS stock_id,
    s.quantity AS stock_quantity_in_stock_table,
    CASE 
        WHEN s.id IS NULL THEN '❌ Stock manquant'
        WHEN p.stock_quantity != s.quantity THEN '⚠️ Quantités différentes'
        ELSE '✅ OK'
    END AS status
FROM products p
LEFT JOIN stock s ON p.id = s.product_id
WHERE p.has_stock = 1
ORDER BY p.id;
