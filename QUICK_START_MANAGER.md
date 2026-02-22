# ⚡ Démarrage Rapide - Application Manager

Guide ultra-rapide pour démarrer l'application manager en 5 minutes.

## 🚀 Étapes Rapides

### 1. MySQL doit être démarré
```powershell
# Vérifier que MySQL fonctionne
mysql --version
```

### 2. Créer la base de données
```powershell
cd backend\scripts
mysql -u root -p < init-database.sql
# Entrez votre mot de passe MySQL
```

### 3. Configurer le backend
```powershell
cd ..\..
cd backend
# Vérifier que .env existe et contient votre mot de passe MySQL
npm install
npm run dev
# ✅ Gardez ce terminal ouvert
```

### 4. Configurer le frontend manager
```powershell
# Dans un NOUVEAU terminal
cd apps\manager
# Créer .env avec : VITE_API_URL=http://localhost:3002/api
```

### 5. Démarrer l'app manager
```powershell
# Depuis la racine du projet
cd ..\..
npm install
npm run dev:manager
```

### 6. Ouvrir dans le navigateur
```
http://localhost:5173
```

### 7. Créer un compte
- Cliquez sur "Inscription"
- Remplissez le formulaire
- Connectez-vous !

---

## ⚠️ Problèmes Courants

**Backend ne démarre pas ?**
- Vérifiez MySQL est démarré
- Vérifiez le mot de passe dans `backend/.env`

**Erreur CORS ?**
- Vérifiez `CORS_ORIGIN` dans `backend/.env`

**Port déjà utilisé ?**
- Changez `PORT` dans `backend/.env`
- Mettez à jour `VITE_API_URL` dans `apps/manager/.env`

---

## 📖 Guide Complet

Pour plus de détails, consultez : `GUIDE_DEMARRAGE_MANAGER.md`
