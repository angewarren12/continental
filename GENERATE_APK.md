# Guide de Génération des APK

Ce guide explique comment générer les APK pour les applications client et manager.

## Prérequis

1. **Android Studio** installé avec :
   - Android SDK
   - Android SDK Platform-Tools
   - Java JDK 11 ou supérieur

2. **Node.js** et **npm** installés

3. **Capacitor CLI** installé globalement :
   ```bash
   npm install -g @capacitor/cli
   ```

## Configuration initiale

### 1. Installer les dépendances Capacitor dans chaque app

Pour l'app **client** :
```bash
cd apps/client
npm install @capacitor/android
npx cap add android
```

Pour l'app **manager** :
```bash
cd apps/manager
npm install @capacitor/android
npx cap add android
```

### 2. Configurer l'URL de l'API

Dans chaque app, créer un fichier `.env.production` :

**apps/client/.env.production** :
```env
VITE_API_URL=https://votre-backend.railway.app
```

**apps/manager/.env.production** :
```env
VITE_API_URL=https://votre-backend.railway.app
```

## Génération des APK

### Étape 1 : Build des applications

**Pour l'app client** :
```bash
cd apps/client
npm run build
```

**Pour l'app manager** :
```bash
cd apps/manager
npm run build
```

### Étape 2 : Synchroniser avec Capacitor

**Pour l'app client** :
```bash
cd apps/client
npx cap sync android
```

**Pour l'app manager** :
```bash
cd apps/manager
npx cap sync android
```

### Étape 3 : Ouvrir dans Android Studio

**Pour l'app client** :
```bash
cd apps/client
npx cap open android
```

**Pour l'app manager** :
```bash
cd apps/manager
npx cap open android
```

### Étape 4 : Générer l'APK dans Android Studio

1. Dans Android Studio, aller dans **Build** → **Generate Signed Bundle / APK**
2. Sélectionner **APK**
3. Créer un nouveau keystore ou utiliser un existant :
   - **Key store path** : Choisir un emplacement pour votre keystore
   - **Key store password** : Créer un mot de passe
   - **Key alias** : Créer un alias (ex: `continental-key`)
   - **Key password** : Créer un mot de passe pour la clé
   - **Validity** : 25 ans (recommandé)
   - **Certificate** : Remplir vos informations

4. Sélectionner **release** comme build variant
5. Cliquer sur **Finish**

L'APK sera généré dans : `apps/client/android/app/release/app-release.apk` (ou `apps/manager/android/app/release/app-release.apk`)

## Génération via ligne de commande (Optionnel)

### Créer un keystore (une seule fois)

```bash
keytool -genkey -v -keystore continental-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias continental-key
```

### Configurer le build gradle

Dans `apps/client/android/app/build.gradle` (et `apps/manager/android/app/build.gradle`), ajouter :

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../../continental-release-key.jks')
            storePassword 'votre_mot_de_passe_keystore'
            keyAlias 'continental-key'
            keyPassword 'votre_mot_de_passe_key'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Générer l'APK via Gradle

```bash
cd apps/client/android
./gradlew assembleRelease
```

L'APK sera dans : `apps/client/android/app/build/outputs/apk/release/app-release.apk`

## Scripts automatisés

Créer un fichier `generate-apk.sh` à la racine :

```bash
#!/bin/bash

# Configuration
KEYSTORE_PATH="./continental-release-key.jks"
KEYSTORE_PASSWORD="votre_mot_de_passe"
KEY_ALIAS="continental-key"
KEY_PASSWORD="votre_mot_de_passe"

echo "🔨 Building Client App..."
cd apps/client
npm run build
npx cap sync android

echo "📦 Generating Client APK..."
cd android
./gradlew assembleRelease

echo "✅ Client APK generated at: apps/client/android/app/build/outputs/apk/release/app-release.apk"

echo "🔨 Building Manager App..."
cd ../../manager
npm run build
npx cap sync android

echo "📦 Generating Manager APK..."
cd android
./gradlew assembleRelease

echo "✅ Manager APK generated at: apps/manager/android/app/build/outputs/apk/release/app-release.apk"

echo "🎉 All APKs generated successfully!"
```

Rendre le script exécutable :
```bash
chmod +x generate-apk.sh
```

Exécuter :
```bash
./generate-apk.sh
```

## Notes importantes

1. **Gardez votre keystore en sécurité** : Vous en aurez besoin pour toutes les mises à jour futures
2. **Version de l'app** : Mettre à jour `version` et `versionCode` dans `android/app/build.gradle` à chaque release
3. **Permissions** : Vérifier que toutes les permissions nécessaires sont dans `AndroidManifest.xml`
4. **Test** : Toujours tester l'APK sur un appareil réel avant de le distribuer

## Distribution

- **Google Play Store** : Nécessite un compte développeur (25$ une fois)
- **Distribution directe** : Partager l'APK directement (moins sécurisé)
- **Firebase App Distribution** : Pour tester avec des utilisateurs bêta
