-- Script pour corriger la structure de la table users
-- Si la table existe avec camelCase, on la supprime et on la recrée avec snake_case

USE continentalBd;

-- Vérifier si la colonne phoneNumber existe (camelCase)
-- Si oui, supprimer la table et la recréer avec la bonne structure

DROP TABLE IF EXISTS users;

-- Recréer la table avec la structure correcte (snake_case)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role ENUM('manager', 'client') NOT NULL,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone_number),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Table users recréée avec succès!' AS message;
