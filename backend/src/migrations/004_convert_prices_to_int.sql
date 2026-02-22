-- Migration pour convertir tous les champs de prix/montant de DECIMAL(10,2) à INT
-- Le FCFA n'a pas de décimales, donc on utilise des entiers

USE continentalBd;

-- Modifier la table users
ALTER TABLE users MODIFY COLUMN total_spent INT DEFAULT 0;

-- Modifier la table products
ALTER TABLE products MODIFY COLUMN price INT NOT NULL;

-- Modifier la table orders
ALTER TABLE orders MODIFY COLUMN total_amount INT NOT NULL;

-- Modifier la table order_items
ALTER TABLE order_items MODIFY COLUMN unit_price INT NOT NULL;
ALTER TABLE order_items MODIFY COLUMN total_price INT NOT NULL;

-- Modifier la table payments (si elle existe)
ALTER TABLE payments MODIFY COLUMN amount INT NOT NULL;

-- Arrondir les valeurs existantes (au cas où il y aurait des décimales)
UPDATE users SET total_spent = ROUND(total_spent);
UPDATE products SET price = ROUND(price);
UPDATE orders SET total_amount = ROUND(total_amount);
UPDATE order_items SET unit_price = ROUND(unit_price), total_price = ROUND(total_price);
UPDATE payments SET amount = ROUND(amount);

SELECT 'Migration terminée: tous les prix sont maintenant en INT' AS message;
