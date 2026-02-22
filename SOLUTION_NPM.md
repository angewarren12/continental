# Solution au problème npm - Installation locale de Firebase CLI

## Problème rencontré
Erreur npm lors de l'installation globale : `Exit handler never called!`

## Solution recommandée : Installation locale

Au lieu d'installer Firebase CLI globalement (qui cause l'erreur), nous allons l'installer localement dans le projet.

### Étape 1 : Installer Firebase CLI localement

```powershell
npm install --save-dev firebase-tools
```

Cette commande installe Firebase CLI dans `node_modules` du projet.

### Étape 2 : Utiliser npx pour exécuter Firebase CLI

Au lieu de `firebase`, utilisez `npx firebase` :

```powershell
# Se connecter à Firebase
npx firebase login

# Déployer les règles
npx firebase deploy --only firestore:rules

# Déployer les index
npx firebase deploy --only firestore:indexes
```

### Étape 3 : Utiliser le script PowerShell automatique

J'ai créé un script qui fait tout automatiquement :

```powershell
.\setup-firebase-local.ps1
```

Ce script :
- ✅ Installe Firebase CLI localement
- ✅ Vous connecte à Firebase
- ✅ Déploie les Security Rules
- ✅ Déploie les Index Firestore

## Commandes npm ajoutées au package.json

Pour faciliter l'utilisation, j'ai ajouté des scripts npm :

```powershell
# Se connecter
npm run firebase:login

# Déployer les règles
npm run firebase:deploy:rules

# Déployer les index
npm run firebase:deploy:indexes

# Déployer tout
npm run firebase:deploy:all
```

## Avantages de l'installation locale

1. ✅ Évite les problèmes d'installation globale
2. ✅ Version spécifique pour le projet
3. ✅ Fonctionne même si npm global a des problèmes
4. ✅ Pas besoin de permissions administrateur

## Alternative : Nettoyer npm et réessayer

Si vous préférez quand même installer globalement :

```powershell
# Nettoyer le cache npm
npm cache clean --force

# Réessayer
npm install -g firebase-tools
```

Mais l'installation locale est recommandée car elle évite ces problèmes.
