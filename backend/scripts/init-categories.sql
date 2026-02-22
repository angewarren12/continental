-- Script pour initialiser les catégories de base
-- Exécuter ce script pour créer les catégories par défaut

USE continentalBd;

-- Vérifier si la table categories existe
SELECT '=== VÉRIFICATION DE LA TABLE CATEGORIES ===' AS info;
SELECT COUNT(*) AS nombre_categories FROM categories;

-- Insérer les catégories par défaut si elles n'existent pas
INSERT IGNORE INTO categories (name, description, icon, color, is_active) VALUES
('Bières', 'Toutes les bières', 'local_bar', '#bd0f3b', TRUE),
('Vins', 'Vins rouges, blancs, rosés', 'wine_bar', '#8B0000', TRUE),
('Cocktails', 'Cocktails et boissons mixtes', 'local_drink', '#FF6B6B', TRUE),
('Soft Drinks', 'Boissons non alcoolisées', 'local_cafe', '#2E7D32', TRUE),
('Eaux', 'Eaux minérales et gazeuses', 'water_drop', '#2196F3', TRUE);

-- Afficher toutes les catégories
SELECT '=== CATÉGORIES DISPONIBLES ===' AS info;
SELECT * FROM categories ORDER BY id;
