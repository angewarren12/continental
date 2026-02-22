# 🚀 Guide Complet de Déploiement

## 📋 Vue d'ensemble

Ce projet comprend :
- **Backend** : API Node.js/Express avec MySQL
- **App Client** : Application React avec Capacitor
- **App Manager** : Application React avec Capacitor

## ⚠️ Important : Netlify n'est pas adapté pour le backend

Netlify est conçu pour les sites statiques. Pour le backend Node.js, utilisez :
- **Railway** (recommandé - gratuit au début) : https://railway.app
- **Render** : https://render.com
- **Heroku** : https://heroku.com

## 📚 Documentation

1. **DEPLOY_QUICK_START.md** - Guide rapide pour démarrer
2. **DEPLOY_BACKEND.md** - Guide détaillé pour le backend
3. **GENERATE_APK.md** - Guide complet pour générer les APK

## 🎯 Démarrage rapide

### 1. Déployer le Backend (Railway)

```bash
# 1. Créer un compte sur railway.app
# 2. Connecter votre repo GitHub
# 3. Railway détectera automatiquement le backend
# 4. Ajouter les variables d'environnement (voir DEPLOY_BACKEND.md)
# 5. Obtenir l'URL de votre API (ex: https://votre-projet.railway.app)
```

### 2. Configurer les Apps

Créer `apps/client/.env.production` :
```env
VITE_API_URL=https://votre-backend.railway.app/api
```

Créer `apps/manager/.env.production` :
```env
VITE_API_URL=https://votre-backend.railway.app/api
```

### 3. Générer les APK

```bash
# Installer Capacitor Android (une seule fois)
cd apps/client
npm install @capacitor/android
npx cap add android

cd ../manager
npm install @capacitor/android
npx cap add android

# Build et générer les APK
.\generate-apk.ps1

# Puis ouvrir dans Android Studio
cd apps/client
npx cap open android
# Build > Generate Signed Bundle / APK
```

## 📝 Variables d'environnement requises

### Backend
```
DB_HOST=votre_host_mysql
DB_PORT=3306
DB_NAME=nom_de_votre_base
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
JWT_SECRET=secret_tres_long_et_securise
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=https://votre-backend.railway.app,capacitor://localhost
```

### Apps (dans .env.production)
```
VITE_API_URL=https://votre-backend.railway.app/api
```

## 🔗 Liens utiles

- [Railway Documentation](https://docs.railway.app)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Android Studio](https://developer.android.com/studio)

## ❓ Besoin d'aide ?

Consultez les fichiers de documentation détaillés :
- `DEPLOY_QUICK_START.md` pour un guide rapide
- `DEPLOY_BACKEND.md` pour les détails du backend
- `GENERATE_APK.md` pour les détails des APK
