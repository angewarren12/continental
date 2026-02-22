# Guide de Démarrage Rapide

## Installation de Firebase CLI

### Méthode 1 : Script PowerShell (Recommandé)

Exécutez le script PowerShell dans le terminal :

```powershell
.\setup-firebase.ps1
```

### Méthode 2 : Installation manuelle

```powershell
# Installer Firebase CLI globalement
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Déployer les index Firestore
firebase deploy --only firestore:indexes
```

## Configuration Firebase dans la Console

1. **Activer Email/Password Authentication**
   - Allez sur [Firebase Console](https://console.firebase.google.com)
   - Projet : `continental-d2f6e`
   - Authentication > Sign-in method
   - Activez **Email/Password**
   - Cliquez sur **Save**

2. **Vérifier Firestore**
   - Allez dans Firestore Database
   - Créez la base de données si nécessaire (mode test ou production)

## Installation des dépendances

```powershell
npm run install:all
```

## Lancer les applications

### App Gestionnaire
```powershell
npm run dev:manager
```
Ouvrez http://localhost:3000

### App Cliente
```powershell
npm run dev:client
```
Ouvrez http://localhost:3001

## Première utilisation

1. **Créer un compte gestionnaire**
   - Ouvrez l'app manager (port 3000)
   - Cliquez sur "Inscription"
   - Entrez votre nom, téléphone et mot de passe
   - Connectez-vous

2. **Créer un compte client**
   - Ouvrez l'app client (port 3001)
   - Cliquez sur "Inscription"
   - Entrez vos informations
   - Connectez-vous

3. **Tester l'application**
   - Dans l'app manager : créer des produits, gérer le stock, créer des commandes
   - Dans l'app client : voir vos commandes et dépenses

## Dépannage

### Erreur "firebase n'est pas reconnu"
- Installez Firebase CLI : `npm install -g firebase-tools`
- Vérifiez que npm est dans votre PATH

### Erreur de connexion Firebase
- Exécutez : `firebase login`
- Vérifiez que vous êtes connecté : `firebase login:list`

### Erreur de déploiement
- Vérifiez que le projet est configuré : `firebase use`
- Vérifiez les permissions dans Firebase Console
