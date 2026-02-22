# 🚀 Feuille de Route Complète - Application Manager

Guide étape par étape pour démarrer l'application manager du restaurant Le Continental.

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation de MySQL](#installation-de-mysql)
3. [Création de la Base de Données](#création-de-la-base-de-données)
4. [Configuration du Backend](#configuration-du-backend)
5. [Démarrage du Backend](#démarrage-du-backend)
6. [Configuration du Frontend Manager](#configuration-du-frontend-manager)
7. [Démarrage du Frontend Manager](#démarrage-du-frontend-manager)
8. [Vérification et Tests](#vérification-et-tests)
9. [Dépannage](#dépannage)

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- ✅ **Node.js** (version 18 ou supérieure)
  - Vérifier : `node --version`
  - Télécharger : https://nodejs.org/
  
- ✅ **npm** (généralement inclus avec Node.js)
  - Vérifier : `npm --version`
  
- ✅ **MySQL** (version 8.0 ou supérieure)
  - Vérifier : `mysql --version`
  - Télécharger : https://dev.mysql.com/downloads/mysql/
  
- ✅ **Git** (optionnel, pour cloner le projet)
  - Vérifier : `git --version`

---

## 🗄️ Installation de MySQL

### Windows

1. **Télécharger MySQL Installer**
   - Aller sur : https://dev.mysql.com/downloads/installer/
   - Choisir "MySQL Installer for Windows"

2. **Installer MySQL**
   - Exécuter l'installer
   - Choisir "Developer Default"
   - Suivre les étapes d'installation
   - **Important** : Notez le mot de passe root que vous définissez

3. **Vérifier l'installation**
   ```powershell
   mysql --version
   ```

4. **Démarrer MySQL**
   - Ouvrir "Services" (Win + R, puis `services.msc`)
   - Chercher "MySQL80" ou "MySQL"
   - Vérifier qu'il est "En cours d'exécution"
   - Si non, cliquer droit → Démarrer

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```

### macOS

```bash
brew install mysql
brew services start mysql
```

---

## 🗃️ Création de la Base de Données

### Étape 1 : Se connecter à MySQL

**Windows (PowerShell) :**
```powershell
mysql -u root -p
```

**Linux/macOS :**
```bash
sudo mysql -u root -p
```

Entrez votre mot de passe MySQL.

### Étape 2 : Exécuter le script SQL

**Option A - Via le script PowerShell (Windows) :**
```powershell
cd C:\Users\hp\continental_react\backend\scripts
.\setup-database.ps1 -MySQLUser root -MySQLPassword votre_mot_de_passe
```

**Option B - Via MySQL en ligne de commande :**
```bash
cd C:\Users\hp\continental_react\backend\scripts
mysql -u root -p < init-database.sql
```

**Option C - Via MySQL Workbench ou phpMyAdmin :**
1. Ouvrir MySQL Workbench
2. Se connecter au serveur local
3. Ouvrir le fichier `backend/scripts/init-database.sql`
4. Exécuter le script (F5 ou bouton "Execute")

### Étape 3 : Vérifier la création

Dans MySQL :
```sql
USE continentalBd;
SHOW TABLES;
```

Vous devriez voir :
- users
- products
- orders
- order_items
- stock
- stock_movements

---

## ⚙️ Configuration du Backend

### Étape 1 : Aller dans le dossier backend

```powershell
cd C:\Users\hp\continental_react\backend
```

### Étape 2 : Installer les dépendances

```powershell
npm install
```

Cela peut prendre quelques minutes. Attendez la fin de l'installation.

### Étape 3 : Configurer le fichier .env

Le fichier `.env` devrait déjà exister. Vérifiez son contenu :

```env
# Configuration de la base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=continentalBd
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql

# Configuration JWT
JWT_SECRET=changez-ce-secret-en-production-123456789
JWT_EXPIRES_IN=7d

# Configuration du serveur
PORT=3002
NODE_ENV=development

# CORS - URLs autorisées
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

**⚠️ Important :** Remplacez `votre_mot_de_passe_mysql` par votre vrai mot de passe MySQL.

---

## 🚀 Démarrage du Backend

### Étape 1 : Démarrer le serveur backend

```powershell
npm run dev
```

Vous devriez voir :
```
✅ Connexion MySQL établie avec succès
🚀 Serveur démarré sur le port 3002
```

### Étape 2 : Vérifier que le backend fonctionne

Ouvrez un navigateur et allez sur :
```
http://localhost:3002/api/health
```

Ou testez avec curl :
```powershell
curl http://localhost:3002/api/health
```

**✅ Si vous voyez une réponse JSON, le backend fonctionne !**

### ⚠️ Gardez ce terminal ouvert
Le backend doit rester en cours d'exécution pour que l'application fonctionne.

---

## 🎨 Configuration du Frontend Manager

### Étape 1 : Créer le fichier .env pour l'app manager

Créez un fichier `.env` dans `apps/manager/` :

```powershell
cd C:\Users\hp\continental_react\apps\manager
```

Créez le fichier `.env` avec ce contenu :

```env
VITE_API_URL=http://localhost:3002/api
```

### Étape 2 : Vérifier les dépendances

Depuis la racine du projet :

```powershell
cd C:\Users\hp\continental_react
npm install
```

Cela installera toutes les dépendances pour le monorepo.

---

## 🚀 Démarrage du Frontend Manager

### Étape 1 : Démarrer l'application manager

**Depuis la racine du projet :**

```powershell
cd C:\Users\hp\continental_react
npm run dev:manager
```

### Étape 2 : Ouvrir l'application

Le terminal affichera quelque chose comme :
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Ouvrez votre navigateur et allez sur :
```
http://localhost:5173
```

### Étape 3 : Créer un compte manager

1. Cliquez sur l'onglet **"Inscription"**
2. Remplissez le formulaire :
   - **Nom** : Votre nom
   - **Numéro de téléphone** : Ex: 0612345678
   - **Mot de passe** : Au moins 6 caractères
   - **Confirmer le mot de passe** : Le même mot de passe
3. Cliquez sur **"Créer le compte"**

✅ Vous devriez être automatiquement connecté et redirigé vers le dashboard !

---

## ✅ Vérification et Tests

### Test 1 : Connexion au backend
- ✅ Backend démarré sur `http://localhost:3002`
- ✅ Message "Connexion MySQL établie avec succès"

### Test 2 : Application manager
- ✅ Application accessible sur `http://localhost:5173`
- ✅ Page de connexion s'affiche
- ✅ Inscription fonctionne
- ✅ Connexion fonctionne
- ✅ Dashboard s'affiche après connexion

### Test 3 : Fonctionnalités de base
- ✅ Voir le dashboard avec les statistiques
- ✅ Accéder à la liste des clients
- ✅ Accéder à la liste des produits
- ✅ Accéder à la gestion du stock
- ✅ Accéder à la liste des commandes

---

## 🔧 Dépannage

### Problème : Erreur de connexion MySQL

**Symptôme :**
```
❌ Erreur de connexion à MySQL: ...
```

**Solutions :**
1. Vérifier que MySQL est démarré :
   ```powershell
   # Windows
   Get-Service MySQL*
   ```

2. Vérifier les identifiants dans `.env` :
   - `DB_USER` et `DB_PASSWORD` sont corrects
   - `DB_NAME=continentalBd` est correct

3. Vérifier que la base de données existe :
   ```sql
   SHOW DATABASES;
   ```

### Problème : Port 3002 déjà utilisé

**Symptôme :**
```
Error: listen EADDRINUSE: address already in use :::3002
```

**Solutions :**
1. Trouver le processus qui utilise le port :
   ```powershell
   netstat -ano | findstr :3002
   ```

2. Changer le port dans `backend/.env` :
   ```env
   PORT=3003
   ```

3. Mettre à jour `apps/manager/.env` :
   ```env
   VITE_API_URL=http://localhost:3003/api
   ```

### Problème : Port 5173 déjà utilisé

**Symptôme :**
```
Port 5173 is in use
```

**Solutions :**
1. Fermer l'autre application qui utilise le port
2. Vite utilisera automatiquement le port suivant (5174, 5175, etc.)

### Problème : Erreur CORS

**Symptôme :**
```
Access to fetch at 'http://localhost:3002/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solutions :**
1. Vérifier `CORS_ORIGIN` dans `backend/.env` :
   ```env
   CORS_ORIGIN=http://localhost:5173,http://localhost:5174
   ```

2. Redémarrer le backend après modification

### Problème : Module non trouvé

**Symptôme :**
```
Cannot find module '@shared/...'
```

**Solutions :**
1. Installer toutes les dépendances :
   ```powershell
   cd C:\Users\hp\continental_react
   npm install
   ```

2. Reconstruire le module shared :
   ```powershell
   npm run build:shared
   ```

### Problème : Base de données vide

**Symptôme :**
- Pas de données dans l'application

**Solutions :**
1. Créer un compte manager (via l'inscription)
2. Créer des produits via l'interface
3. Créer des clients (via l'app cliente ou directement dans la BD)

---

## 📝 Commandes Utiles

### Redémarrer le backend
```powershell
# Arrêter : Ctrl + C
# Redémarrer :
cd backend
npm run dev
```

### Redémarrer le frontend manager
```powershell
# Arrêter : Ctrl + C
# Redémarrer :
npm run dev:manager
```

### Voir les logs MySQL
```sql
-- Se connecter à MySQL
mysql -u root -p

-- Voir les utilisateurs
SELECT * FROM continentalBd.users;

-- Voir les produits
SELECT * FROM continentalBd.products;

-- Voir les commandes
SELECT * FROM continentalBd.orders;
```

### Réinitialiser la base de données
```sql
DROP DATABASE IF EXISTS continentalBd;
-- Puis réexécuter init-database.sql
```

---

## 🎯 Checklist de Démarrage

Utilisez cette checklist pour vérifier que tout est configuré :

- [ ] MySQL installé et démarré
- [ ] Base de données `continentalBd` créée
- [ ] Toutes les tables créées (6 tables)
- [ ] Fichier `backend/.env` configuré avec les bonnes valeurs
- [ ] Dépendances backend installées (`npm install` dans `backend/`)
- [ ] Backend démarré et connecté à MySQL
- [ ] Backend accessible sur `http://localhost:3002`
- [ ] Fichier `apps/manager/.env` créé avec `VITE_API_URL`
- [ ] Dépendances frontend installées (`npm install` à la racine)
- [ ] Application manager démarrée sur `http://localhost:5173`
- [ ] Compte manager créé et connecté
- [ ] Dashboard accessible et fonctionnel

---

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans les terminaux (backend et frontend)
2. Vérifiez les fichiers `.env` (pas d'espaces, pas de guillemets)
3. Vérifiez que MySQL est démarré
4. Vérifiez que les ports ne sont pas utilisés par d'autres applications
5. Consultez la section [Dépannage](#dépannage) ci-dessus

---

## 🎉 Félicitations !

Si vous avez suivi toutes les étapes et que l'application fonctionne, vous êtes prêt à utiliser l'application manager du restaurant Le Continental !

**Prochaines étapes :**
- Créer des produits
- Gérer le stock
- Créer des commandes
- Gérer les clients

---

**Date de création :** $(date)
**Version :** 1.0.0
