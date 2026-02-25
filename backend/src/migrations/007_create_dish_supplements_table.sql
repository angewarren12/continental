-- Migration pour créer la table dish_supplements
-- Cette table stocke les suppléments intégrés directement dans les plats

USE continentalBd;

-- Créer la table dish_supplements
CREATE TABLE IF NOT EXISTS dish_supplements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dish_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dish_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_dish_id (dish_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
