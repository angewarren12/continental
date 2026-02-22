# Solutions pour résoudre le problème npm

## Problème
Erreur npm lors de l'installation globale : "Exit handler never called!"

## Solutions

### Solution 1 : Installation locale (Recommandé)

Au lieu d'installer globalement, installez Firebase CLI localement dans le projet :

```powershell
# Dans le dossier continental_react
npm install --save-dev firebase-tools
```

Ensuite, utilisez `npx firebase` au lieu de `firebase` :

```powershell
npx firebase login
npx firebase deploy --only firestore:rules
npx firebase deploy --only firestore:indexes
```

### Solution 2 : Réparer npm

```powershell
# Nettoyer le cache npm
npm cache clean --force

# Réinstaller npm (si nécessaire)
npm install -g npm@latest

# Réessayer l'installation
npm install -g firebase-tools
```

### Solution 3 : Utiliser yarn (alternative à npm)

```powershell
# Installer yarn si pas déjà installé
npm install -g yarn

# Installer Firebase CLI avec yarn
yarn global add firebase-tools
```

### Solution 4 : Installation manuelle depuis GitHub

1. Téléchargez la dernière release depuis : https://github.com/firebase/firebase-tools/releases
2. Extrayez l'archive
3. Ajoutez le dossier au PATH Windows

### Solution 5 : Utiliser Chocolatey (Windows)

```powershell
# Installer Chocolatey si pas déjà installé
# Puis installer Firebase CLI
choco install firebase-cli
```

## Script PowerShell mis à jour (Solution locale)

Le script `setup-firebase-local.ps1` utilise l'installation locale.
