# Configuration de la Base de Données MySQL

## Nom de la base de données
**continentalBd**

## Installation et Configuration

### 1. Prérequis
- MySQL installé et démarré
- Accès administrateur à MySQL

### 2. Création de la base de données

#### Option A: Utiliser le script PowerShell (Windows)
```powershell
cd backend/scripts
.\setup-database.ps1 -MySQLUser root -MySQLPassword votre_mot_de_passe
```

#### Option B: Utiliser le script Bash (Linux/Mac)
```bash
cd backend/scripts
chmod +x setup-database.sh
./setup-database.sh
```

#### Option C: Exécuter manuellement le script SQL
```bash
mysql -u root -p < backend/scripts/init-database.sql
```

### 3. Configuration du fichier .env

Copiez le fichier `.env.example` vers `.env` et configurez les variables :

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=continentalBd
DB_USER=root
DB_PASSWORD=votre_mot_de_passe

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

PORT=3002
NODE_ENV=development

CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### 4. Vérification

Pour vérifier que la base de données a été créée correctement :

```sql
USE continentalBd;
SHOW TABLES;
```

Vous devriez voir les tables suivantes :
- users
- products
- orders
- order_items
- stock
- stock_movements

## Structure de la Base de Données

### Table: users
- Gère les utilisateurs (managers et clients)
- Authentification par téléphone + mot de passe

### Table: products
- Catalogue des produits (plats et boissons)
- Gestion des prix et catégories

### Table: orders
- Commandes des clients
- Statuts et paiements

### Table: order_items
- Détails des articles dans chaque commande

### Table: stock
- Stock actuel des produits

### Table: stock_movements
- Historique des mouvements de stock
- Traçabilité complète

## Commandes Utiles

### Se connecter à MySQL
```bash
mysql -u root -p
```

### Utiliser la base de données
```sql
USE continentalBd;
```

### Voir toutes les tables
```sql
SHOW TABLES;
```

### Voir la structure d'une table
```sql
DESCRIBE users;
```

### Réinitialiser la base de données (ATTENTION: supprime toutes les données)
```sql
DROP DATABASE IF EXISTS continentalBd;
```
Puis réexécutez le script d'initialisation.

## Dépannage

### Erreur: "Access denied"
- Vérifiez les identifiants dans le fichier `.env`
- Assurez-vous que l'utilisateur MySQL a les droits nécessaires

### Erreur: "Can't connect to MySQL server"
- Vérifiez que MySQL est démarré
- Vérifiez le host et le port dans `.env`

### Erreur: "Database already exists"
- La base de données existe déjà
- Vous pouvez continuer ou la supprimer et la recréer
