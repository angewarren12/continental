# Configuration Terminée ✅

Le fichier `.env` est créé. Voici les prochaines étapes pour démarrer le projet :

## ✅ Étape 1 : Créer la base de données (si pas encore fait)

### Option A - Script PowerShell :
```powershell
cd backend/scripts
.\setup-database.ps1 -MySQLUser root -MySQLPassword votre_mot_de_passe
```

### Option B - Manuellement :
```bash
mysql -u root -p < backend/scripts/init-database.sql
```

## ✅ Étape 2 : Installer les dépendances du backend

```bash
cd backend
npm install
```

## ✅ Étape 3 : Démarrer le serveur backend

```bash
npm run dev
```

Vous devriez voir :
- `✅ Connexion MySQL établie avec succès`
- `🚀 Serveur démarré sur le port 3002`

## ✅ Étape 4 : Configurer les apps frontend

Dans `apps/manager` et `apps/client`, créez un fichier `.env` avec :

```env
VITE_API_URL=http://localhost:3002/api
```

## ✅ Étape 5 : Démarrer les apps frontend

Dans un nouveau terminal :

```bash
# Terminal 1 - Manager app
npm run dev:manager

# Terminal 2 - Client app  
npm run dev:client
```

## 🔍 Vérification

1. ✅ Base de données `continentalBd` créée
2. ✅ Fichier `.env` configuré dans `backend/`
3. ✅ Backend démarré sur `http://localhost:3002`
4. ✅ Apps frontend configurées avec `VITE_API_URL`

## 📝 Notes importantes

- Le backend doit être démarré avant les apps frontend
- Vérifiez que MySQL est démarré avant de lancer le backend
- Le port par défaut du backend est **3002**
- Les apps frontend utilisent généralement les ports **5173** et **5174**

## 🐛 Dépannage

### Erreur de connexion MySQL
- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `.env`
- Vérifiez que la base `continentalBd` existe

### Erreur CORS
- Vérifiez que `CORS_ORIGIN` dans `.env` correspond aux URLs des apps frontend

### Port déjà utilisé
- Changez `PORT` dans `.env` si le port 3002 est déjà utilisé
