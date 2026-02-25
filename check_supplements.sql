-- Requête pour vérifier les suppléments liés au plat "Spaguetti"

-- 1. Vérifier le produit Spaguetti
SELECT * FROM products WHERE name = 'Spaguetti';

-- 2. Vérifier les suppléments liés au Spaguetti
SELECT 
    ps.id,
    ps.product_id,
    ps.supplement_product_id,
    ps.supplement_name,
    ps.supplement_price,
    ps.is_available,
    p.name as product_name,
    psup.name as supplement_product_name
FROM product_supplements ps
LEFT JOIN products p ON ps.product_id = p.id
LEFT JOIN products psup ON ps.supplement_product_id = psup.id
WHERE p.name = 'Spaguetti';

-- 3. Vérifier tous les produits avec suppléments
SELECT 
    p.name as product_name,
    COUNT(ps.id) as supplement_count
FROM products p
LEFT JOIN product_supplements ps ON p.id = ps.product_id
WHERE p.product_type = 'dish'
GROUP BY p.id, p.name
HAVING COUNT(ps.id) > 0;

-- 4. Vérifier la structure de la table product_supplements
DESCRIBE product_supplements;
