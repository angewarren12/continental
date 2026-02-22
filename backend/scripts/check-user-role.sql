-- Script pour vérifier et corriger le rôle de l'utilisateur
USE continentalBd;

-- Vérifier le rôle actuel
SELECT id, name, role FROM users WHERE id = 1;

-- Si le rôle est "gestionnaire" au lieu de "manager", le corriger :
-- UPDATE users SET role = 'manager' WHERE id = 1 AND role != 'manager';
