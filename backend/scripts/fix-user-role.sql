-- Script pour corriger le rôle de l'utilisateur
-- Si le rôle est stocké comme "gestionnaire" au lieu de "manager"

USE continentalBd;

-- Vérifier le rôle actuel
SELECT id, name, role FROM users;

-- Corriger tous les utilisateurs qui ont "gestionnaire" au lieu de "manager"
-- Note: MySQL ENUM est sensible à la casse, donc si vous avez créé l'utilisateur avec un rôle différent,
-- vous devrez peut-être modifier directement dans la base de données

-- Pour mettre à jour le rôle à "manager" pour l'utilisateur avec l'ID 1 :
UPDATE users SET role = 'manager' WHERE id = 1;

-- Vérifier après la mise à jour
SELECT id, name, role FROM users WHERE id = 1;
