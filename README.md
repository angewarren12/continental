# Le Continental - Application de Gestion Restaurant

Application mobile React Capacitor pour la gestion complète du restaurant Le Continental.

## Structure du projet

Le projet est organisé en monorepo avec deux applications distinctes :

- **apps/manager** : Application pour le staff du restaurant
- **apps/client** : Application pour les clients
- **shared** : Code partagé (types, services Firebase, utilitaires)

## Technologies

- React + TypeScript
- Capacitor (iOS/Android)
- Firebase (Firestore, Authentication, Storage)
- React Router
- Material-UI
- date-fns

## Installation

```bash
npm run install:all
```

## Configuration Firebase

1. Créer un projet Firebase sur [Firebase Console](https://console.firebase.google.com)
2. Activer Authentication (Phone Auth) et Firestore
3. Copier les credentials dans `shared/src/firebase/config.ts` ou utiliser des variables d'environnement
4. Déployer les security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Développement

### App Gestionnaire
```bash
npm run dev:manager
```
L'application sera accessible sur http://localhost:3000

### App Cliente
```bash
npm run dev:client
```
L'application sera accessible sur http://localhost:3001

## Build

### App Gestionnaire
```bash
npm run build:manager
```

### App Cliente
```bash
npm run build:client
```

## Fonctionnalités

### App Gestionnaire
- Authentification par téléphone
- Dashboard avec statistiques
- Gestion des clients (recherche, historique)
- Gestion des produits (CRUD)
- Gestion du stock (boissons uniquement)
- Création et suivi des commandes
- Traitement des paiements

### App Cliente
- Inscription/Connexion par téléphone
- Dashboard avec vue d'ensemble des dépenses
- Historique des commandes avec détails
- Preuve de paiement pour chaque commande
- Gestion du profil

## Structure des données Firebase

### Collections principales:
- `users` - Utilisateurs (clients et gestionnaires)
- `products` - Produits du restaurant
- `orders` - Commandes
- `stock` - Stock des boissons
- `stockMovements` - Historique des mouvements de stock

## Sécurité

Les security rules Firestore garantissent que:
- Les clients ne peuvent lire que leurs propres données
- Les gestionnaires ont accès complet en lecture/écriture
- Les données sont validées côté serveur

## Tests

```bash
# Dans chaque app
npm test
```

## Déploiement

Voir [BUILD.md](BUILD.md) pour les instructions détaillées de build et déploiement.

## License

Propriétaire - Le Continental
