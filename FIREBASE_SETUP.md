# Configuration Firebase pour Le Continental

## Configuration de l'authentification

### 1. Activer Email/Password Authentication

1. Allez dans [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet `continental-d2f6e`
3. Allez dans **Authentication** > **Sign-in method**
4. Cliquez sur **Email/Password**
5. Activez **Email/Password** (premier toggle)
6. Cliquez sur **Save**

### 2. Configuration Firestore

#### Déployer les Security Rules

```bash
firebase deploy --only firestore:rules
```

#### Déployer les Index

```bash
firebase deploy --only firestore:indexes
```

### 3. Comment fonctionne l'authentification

L'application utilise Firebase Email/Password Authentication mais avec le numéro de téléphone comme identifiant. Le système convertit automatiquement le numéro de téléphone en format email pour Firebase Auth :

- Numéro: `+225612345678` → Email Auth: `+225612345678@continental.local`

Le vrai numéro de téléphone est stocké dans le document Firestore de l'utilisateur.

### 4. Structure des données utilisateur

Chaque utilisateur a :
- Un compte Firebase Auth (avec email formaté)
- Un document dans Firestore `users/{userId}` avec :
  - `phoneNumber`: Le vrai numéro de téléphone
  - `name`: Le nom de l'utilisateur
  - `role`: 'manager' ou 'client'
  - `email`: Email optionnel
  - `totalSpent`: Total dépensé
  - `createdAt`: Date de création

### 5. Sécurité

- Les mots de passe sont hashés et sécurisés par Firebase
- Les security rules Firestore protègent les données
- Seuls les clients peuvent voir leurs propres données
- Les gestionnaires ont accès complet

### 6. Test

Pour tester l'authentification :

1. Créez un compte gestionnaire via l'app manager
2. Créez un compte client via l'app client
3. Connectez-vous avec téléphone + mot de passe

### Notes importantes

- Le numéro de téléphone doit être au format international (+225...)
- Le mot de passe doit contenir au moins 6 caractères
- Les numéros français commençant par 0 sont automatiquement convertis en +225
