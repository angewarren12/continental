# Correction de la Base de Données

## Problème
La table `users` a été créée avec des colonnes en `camelCase` (`phoneNumber`, `password`) alors que les modèles Sequelize attendent `snake_case` (`phone_number`, `password_hash`).

## Solution

### Option 1 : Recréer la table users uniquement (Recommandé si vous n'avez pas encore de données importantes)

Exécutez le script SQL suivant dans MySQL :

```sql
USE continentalBd;

DROP TABLE IF EXISTS users;

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
```

### Option 2 : Recréer toute la base de données

Si vous n'avez pas de données importantes, vous pouvez recréer toute la base :

```bash
# Dans PowerShell
mysql -u root -p < backend/scripts/init-database.sql
```

Ou exécutez directement le fichier `backend/scripts/init-database.sql` dans votre client MySQL.

### Option 3 : Utiliser le script de correction

Exécutez le fichier `backend/scripts/fix-users-table.sql` :

```bash
mysql -u root -p < backend/scripts/fix-users-table.sql
```

## Vérification

Après la correction, vérifiez que la structure est correcte :

```sql
USE continentalBd;
DESCRIBE users;
```

Vous devriez voir :
- `phone_number` (pas `phoneNumber`)
- `password_hash` (pas `password`)
- `total_spent` (pas `totalSpent`)
- `created_at` (pas `createdAt`)
- `updated_at` (pas `updatedAt`)

## Après la correction

1. Redémarrez le serveur backend
2. Réessayez l'inscription depuis l'application frontend
