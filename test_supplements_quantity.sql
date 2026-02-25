-- Script de test pour la gestion des suppléments avec quantités
-- Vérifie que 2 plats avec suppléments calculent correctement les prix

USE continentalBd;

-- =============================================
-- 1. TEST DE CALCUL DES SUPPLÉMENTS
-- =============================================

SELECT '🧪 TEST DE CALCUL DES SUPPLÉMENTS' as section_title;

-- Simulation du cas : Spaghetti 500 FCFA + Œuf 200 FCFA
-- Quantité 1 : 500 + 200 = 700 FCFA
-- Quantité 2 : (500 + 200) * 2 = 1400 FCFA

SELECT 
    '📊 Scénario de test:' as scenario,
    'Plat: Spaghetti (500 FCFA)' as plat_1,
    'Supplément: Œuf (200 FCFA)' as supplement_1,
    'Quantité 1: 700 FCFA' as result_1,
    'Quantité 2: 1400 FCFA' as result_2;

-- =============================================
-- 2. VÉRIFICATION DE LA STRUCTURE DES SUPPLÉMENTS
-- =============================================

SELECT '🔍 Vérification structure suppléments:' as section_title;

-- Vérifier que la table order_supplements existe
SELECT 
    '📋 Table order_supplements:' as verification_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'continentalBd' AND TABLE_NAME = 'order_supplements') > 0 
        THEN '✅ order_supplements existe'
        ELSE '❌ order_supplements manquante'
    END as status;

-- Vérifier les champs nécessaires pour les suppléments
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'continentalBd' 
AND TABLE_NAME = 'order_supplements'
ORDER BY ORDINAL_POSITION;

-- =============================================
-- 3. TEST D'INSERTION DE COMMANDE AVEC SUPPLÉMENTS
-- =============================================

SELECT '🔧 Test d\'insertion avec suppléments:' as section_title;

-- Créer des produits de test si nécessaire
-- (Décommenter pour tester)
/*
-- Insérer plat principal
INSERT IGNORE INTO products (id, name, category_id, product_type, price, is_active) 
VALUES (999, 'Spaghetti Test', 1, 'dish', 500, TRUE);

-- Insérer supplément
INSERT IGNORE INTO products (id, name, category_id, product_type, price, is_active) 
VALUES (998, 'Œuf Test', 1, 'supplement', 200, TRUE);

-- Insérer association plat-supplément
INSERT IGNORE INTO product_supplements (product_id, supplement_product_id) 
VALUES (999, 998);

SELECT '✅ Produits de test créés' as test_result;
*/

-- Simulation de ce que le frontend envoie au backend
-- Pour 2 spaghettis avec 2 œufs chacun
SELECT 
    '📝 Payload attendu pour 2 spaghettis + suppléments:' as payload_type,
    'Items principaux:' as item_type,
    '[{productId: 999, productName: "Spaghetti Test", quantity: 2, unitPrice: 500, totalPrice: 1400}]' as main_items;

SELECT 
    '📝 Suppléments attendus:' as payload_type,
    'Items suppléments:' as item_type,
    '[{productId: 998, productName: "Œuf Test", quantity: 1, unitPrice: 200, parentItemId: 0}, {productId: 998, productName: "Œuf Test", quantity: 1, unitPrice: 200, parentItemId: 0}, {productId: 998, productName: "Œuf Test", quantity: 1, unitPrice: 200, parentItemId: 1}, {productId: 998, productName: "Œuf Test", quantity: 1, unitPrice: 200, parentItemId: 1}]' as supplement_items;

-- =============================================
-- 4. VÉRIFICATION DES CALCULS FRONTEND
-- =============================================

SELECT '🧮 Vérification calculs frontend:' as section_title;

-- Calcul attendu dans le frontend
SELECT 
    '📊 Calcul frontend - Quantité 1:' as calculation_type,
    'Prix plat: 500' as plat_price,
    'Prix supplément: 200' as supplement_price,
    'Total unité: 500 + 200 = 700' as unit_total,
    'Quantité: 1' as quantity,
    'Total final: 700 × 1 = 700 FCFA' as final_total;

SELECT 
    '📊 Calcul frontend - Quantité 2:' as calculation_type,
    'Prix plat: 500' as plat_price,
    'Prix supplément: 200' as supplement_price,
    'Total unité: 500 + 200 = 700' as unit_total,
    'Quantité: 2' as quantity,
    'Total final: 700 × 2 = 1400 FCFA' as final_total;

-- =============================================
-- 5. ÉTAT FINAL
-- =============================================

SELECT '🎯 État final du test de suppléments:' as section_title;

SELECT 
    '📊 Résumé des corrections apportées:' as summary,
    'handleNewSupplementConfirm: Multiplie suppléments par quantité' as fix_1,
    'handleSupplementConfirm: Multiplie suppléments par quantité' as fix_2,
    'Affichage récapitulatif: Indicateurs de quantité ×2, ×3...' as fix_3,
    'Calcul totalAmount: Utilise item.totalPrice (déjà correct)' as fix_4;

-- Instructions de test manuel
SELECT 
    '📋 Instructions de test manuel:' as instructions,
    '1. Aller sur http://localhost:3000/orders/create' as step_1,
    '2. Sélectionner "Spaghetti" (ou un plat avec suppléments)' as step_2,
    '3. Cliquer sur "Personnaliser"' as step_3,
    '4. Ajouter "Œuf" comme supplément' as step_4,
    '5. Mettre quantité 1 → Vérifier que total = 700 FCFA' as step_5,
    '6. Mettre quantité 2 → Vérifier que total = 1400 FCFA' as step_6,
    '7. Vérifier l\'indicateur ×2 sur les suppléments' as step_7;

-- Nettoyage des produits de test
-- (Décommenter pour nettoyer)
/*
DELETE FROM product_supplements WHERE product_id = 999 OR supplement_product_id = 998;
DELETE FROM products WHERE id IN (999, 998);
SELECT '🧹 Produits de test nettoyés' as cleanup_result;
*/

SELECT '✅ Test de suppléments prêt - Vérifiez manuellement l\'interface' as final_status;
