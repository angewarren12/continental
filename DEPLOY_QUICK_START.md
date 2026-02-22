# Guide Rapide de Déploiement

## 🚀 Déploiement du Backend sur Railway (Recommandé)

### Étape 1 : Préparer le repository
```bash
# S'assurer que tout est commité
git add .
git commit -m "Prepare for deployment"
git push
```

### Étape 2 : Déployer sur Railway
1. Aller sur [railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Cliquer sur "New Project" → "Deploy from GitHub repo"
4. Sélectionner votre repository
5. Railway détectera automatiquement le backend

### Étape 3 : Configurer les variables d'environnement
Dans Railway, aller dans **Variables** et ajouter :

```
DB_HOST=votre_host_mysql
DB_PORT=3306
DB_NAME=nom_de_votre_base
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
JWT_SECRET=un_secret_tres_long_et_securise_minimum_32_caracteres
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=https://votre-app-client.netlify.app,https://votre-app-manager.netlify.app
```

### Étape 4 : Obtenir l'URL de l'API
Railway vous donnera une URL comme : `https://votre-projet.railway.app`

### Étape 5 : Exécuter les migrations
Dans Railway, aller dans **Settings** → **Deploy** → **Run Command** :
```bash
cd backend && npm run migrate
```

## 📱 Génération des APK

### Option 1 : Via Android Studio (Recommandé)

1. **Installer Capacitor Android** :
```bash
cd apps/client
npm install @capacitor/android
npx cap add android

cd ../manager
npm install @capacitor/android
npx cap add android
```

2. **Configurer l'URL de l'API** :

Créer `apps/client/.env.production` :
```env
VITE_API_URL=https://votre-backend.railway.app/api
```

Créer `apps/manager/.env.production` :
```env
VITE_API_URL=https://votre-backend.railway.app/api
```

3. **Build et synchroniser** :
```bash
# Client
cd apps/client
npm run build
npx cap sync android
npx cap open android

# Manager
cd apps/manager
npm run build
npx cap sync android
npx cap open android
```

4. **Dans Android Studio** :
   - Build → Generate Signed Bundle / APK
   - Sélectionner APK
   - Créer un keystore (gardez-le en sécurité !)
   - Générer l'APK

### Option 2 : Via ligne de commande

Voir le fichier `GENERATE_APK.md` pour les détails complets.

## 🔧 Configuration CORS

Dans votre backend déployé, s'assurer que `CORS_ORIGIN` inclut :
- L'URL de votre backend (pour les requêtes depuis les apps mobiles)
- Les URLs de vos apps web si vous les déployez aussi

Exemple :
```
CORS_ORIGIN=https://votre-backend.railway.app,capacitor://localhost,http://localhost
```

## 📝 Checklist de déploiement

- [ ] Backend déployé sur Railway
- [ ] Variables d'environnement configurées
- [ ] Migrations exécutées
- [ ] URL de l'API obtenue
- [ ] `.env.production` créé dans les apps avec l'URL de l'API
- [ ] Apps buildées (`npm run build`)
- [ ] Capacitor Android ajouté
- [ ] APK générés et testés

## 🆘 Problèmes courants

### Le backend ne démarre pas
- Vérifier que toutes les variables d'environnement sont définies
- Vérifier les logs dans Railway

### Les apps ne peuvent pas se connecter à l'API
- Vérifier que `VITE_API_URL` est correct dans `.env.production`
- Vérifier que CORS est configuré correctement
- Vérifier que l'URL de l'API se termine par `/api`

### L'APK ne se connecte pas à l'API
- Vérifier que `VITE_API_URL` est défini dans `.env.production`
- Rebuild l'app après avoir modifié `.env.production`
- Vérifier que le backend accepte les requêtes depuis `capacitor://localhost`
