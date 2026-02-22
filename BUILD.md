# Guide de Build et Déploiement

## Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- Capacitor CLI installé globalement: `npm install -g @capacitor/cli`
- Xcode (pour iOS) ou Android Studio (pour Android)

## Installation

```bash
# Installer toutes les dépendances
npm run install:all

# Build du code partagé
npm run build:shared
```

## Build des Applications

### App Gestionnaire

```bash
cd apps/manager
npm run build
npx cap sync
```

### App Cliente

```bash
cd apps/client
npm run build
npx cap sync
```

## Déploiement iOS

### Configuration

1. Ouvrir Xcode:
```bash
cd apps/manager
npx cap open ios
```

2. Configurer le Bundle Identifier dans Xcode
3. Configurer les certificats de signature
4. Ajouter les capacités nécessaires (Push Notifications, Camera)

### Build

```bash
# Dans Xcode
Product > Archive
```

### Déploiement

1. Uploader vers App Store Connect
2. Soumettre pour révision

## Déploiement Android

### Configuration

1. Ouvrir Android Studio:
```bash
cd apps/manager
npx cap open android
```

2. Configurer le `applicationId` dans `android/app/build.gradle`
3. Configurer les permissions dans `AndroidManifest.xml`

### Build

```bash
cd android
./gradlew assembleRelease
```

### Déploiement

1. Créer une clé de signature
2. Signer l'APK
3. Uploader vers Google Play Console

## Variables d'Environnement

Créer un fichier `.env` dans chaque app avec:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Configuration Firebase

1. Déployer les security rules:
```bash
firebase deploy --only firestore:rules
```

2. Déployer les index:
```bash
firebase deploy --only firestore:indexes
```

## Notes

- Les builds de production doivent avoir les variables d'environnement configurées
- Vérifier que les permissions Capacitor sont correctement configurées
- Tester sur des appareils réels avant le déploiement
