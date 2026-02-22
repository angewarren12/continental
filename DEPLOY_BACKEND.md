# Guide de Déploiement du Backend

## ⚠️ Important : Netlify n'est pas adapté pour un backend Node.js

Netlify est conçu pour les sites statiques et les fonctions serverless, pas pour des applications Node.js complètes avec Express.

## Options recommandées pour déployer le backend

### Option 1 : Railway (Recommandé - Gratuit au début)
1. Créer un compte sur [Railway.app](https://railway.app)
2. Cliquer sur "New Project" → "Deploy from GitHub repo"
3. Sélectionner votre repository
4. Railway détectera automatiquement le backend
5. Configurer les variables d'environnement dans les settings

### Option 2 : Render
1. Créer un compte sur [Render.com](https://render.com)
2. Créer un nouveau "Web Service"
3. Connecter votre repository GitHub
4. Configurer :
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Root Directory: `backend`

### Option 3 : Heroku
1. Créer un compte sur [Heroku](https://heroku.com)
2. Installer Heroku CLI
3. Suivre les instructions ci-dessous

## Configuration des variables d'environnement

Créer un fichier `.env` sur la plateforme de déploiement avec :

```env
# Base de données MySQL
DB_HOST=votre_host_mysql
DB_PORT=3306
DB_NAME=nom_de_votre_base
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_secret_jwt_tres_long_et_securise
JWT_EXPIRES_IN=7d

# Port (généralement géré automatiquement par la plateforme)
PORT=3002

# CORS - Ajouter les URLs de vos apps déployées
CORS_ORIGIN=https://votre-app-client.netlify.app,https://votre-app-manager.netlify.app

# Environnement
NODE_ENV=production
```

## Étapes de déploiement sur Railway (Exemple)

1. **Préparer le backend pour la production** :
   ```bash
   cd backend
   npm run build
   ```

2. **Créer un Procfile** (pour Railway/Heroku) :
   ```
   web: cd backend && npm start
   ```

3. **Sur Railway** :
   - Connecter votre repo GitHub
   - Railway détectera automatiquement le backend
   - Ajouter les variables d'environnement
   - Déployer

4. **Obtenir l'URL de votre API** :
   - Railway vous donnera une URL comme : `https://votre-backend.railway.app`
   - Mettre à jour les fichiers de configuration des apps client et manager

## Mise à jour des apps pour utiliser l'API déployée

Dans `shared/src/api/client.ts`, mettre à jour l'URL de base :

```typescript
const API_BASE_URL = process.env.VITE_API_URL || 'https://votre-backend.railway.app';
```

Puis dans les apps, créer un fichier `.env.production` :

```env
VITE_API_URL=https://votre-backend.railway.app
```

## Migration de la base de données

Après le déploiement, exécuter les migrations :

```bash
cd backend
npm run migrate
```

Ou via SSH sur la plateforme de déploiement.
