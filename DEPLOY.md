# Guide de Déploiement Firebase

## Installation de Firebase CLI

### Option 1 : Installation globale avec npm (recommandé)

```bash
npm install -g firebase-tools
```

### Option 2 : Installation locale dans le projet

```bash
npm install --save-dev firebase-tools
```

Puis utilisez `npx firebase` au lieu de `firebase` dans les commandes.

## Connexion à Firebase

Après l'installation, connectez-vous à votre compte Firebase :

```bash
firebase login
```

Cela ouvrira votre navigateur pour vous authentifier.

## Initialisation du projet Firebase (si nécessaire)

Si le projet n'est pas encore initialisé :

```bash
firebase init
```

Sélectionnez :
- Firestore
- Functions (optionnel)
- Hosting (optionnel)

## Déploiement des Security Rules Firestore

```bash
firebase deploy --only firestore:rules
```

## Déploiement des Index Firestore

```bash
firebase deploy --only firestore:indexes
```

## Déploiement complet

```bash
firebase deploy
```

## Vérification

Après le déploiement, vérifiez dans Firebase Console :
1. Allez dans Firestore Database
2. Cliquez sur l'onglet "Rules"
3. Vérifiez que les règles sont bien déployées

## Commandes utiles

- `firebase login` - Se connecter
- `firebase logout` - Se déconnecter
- `firebase projects:list` - Lister vos projets
- `firebase use` - Sélectionner un projet
- `firebase deploy --only firestore:rules` - Déployer uniquement les règles
- `firebase deploy --only firestore:indexes` - Déployer uniquement les index
