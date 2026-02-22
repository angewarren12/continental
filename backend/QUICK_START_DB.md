# Guide Rapide - Configuration de la Base de Données

## Nom de la base de données
**continentalBd**

## Installation Rapide (Windows)

### 1. Créer la base de données

Ouvrez PowerShell dans le dossier `backend/scripts` et exécutez :

```powershell
.\setup-database.ps1 -MySQLUser root -MySQLPassword votre_mot_de_passe
```

**OU** exécutez manuellement :

```powershell
mysql -u root -p < scripts\init-database.sql
```

### 2. Configurer le fichier .env

Créez un fichier `.env` dans le dossier `backend/` avec :

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=continentalBd
DB_USER=root
DB_PASSWORD=votre_mot_de_passe

JWT_SECRET=changez-ce-secret-en-production
JWT_EXPIRES_IN=7d

PORT=3002
NODE_ENV=development

CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### 3. Installer les dépendances et démarrer

```bash
cd backend
npm install
npm run dev
```

## Vérification

Pour vérifier que tout fonctionne :

1. Le serveur démarre sans erreur
2. Vous voyez le message : `✅ Connexion MySQL établie avec succès`
3. Les tables sont créées (vérifiez avec `SHOW TABLES;` dans MySQL)

## Fichiers créés

- `backend/scripts/init-database.sql` - Script SQL complet
- `backend/scripts/setup-database.ps1` - Script PowerShell pour Windows
- `backend/scripts/setup-database.sh` - Script Bash pour Linux/Mac
- `backend/.env.example` - Exemple de configuration
- `backend/README_DATABASE.md` - Documentation complète

## Besoin d'aide ?

Consultez `backend/README_DATABASE.md` pour plus de détails.
