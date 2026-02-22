# Script PowerShell pour installer Firebase CLI localement et déployer les règles

Write-Host "=== Installation et Configuration Firebase (Mode Local) ===" -ForegroundColor Cyan

# Vérifier si Node.js est installé
Write-Host "`nVérification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js installé: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Node.js n'est pas installé!" -ForegroundColor Red
    Write-Host "Veuillez installer Node.js depuis https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Vérifier si npm est disponible
Write-Host "`nVérification de npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "npm installé: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: npm n'est pas installé!" -ForegroundColor Red
    exit 1
}

# Installer Firebase CLI localement
Write-Host "`nInstallation de Firebase CLI (local)..." -ForegroundColor Yellow
if (Test-Path "node_modules\.bin\firebase.cmd") {
    Write-Host "Firebase CLI déjà installé localement!" -ForegroundColor Green
} else {
    Write-Host "Installation en cours..." -ForegroundColor Yellow
    npm install --save-dev firebase-tools
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR lors de l'installation de Firebase CLI" -ForegroundColor Red
        Write-Host "Essayez: npm cache clean --force puis réessayez" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "Firebase CLI installé avec succès!" -ForegroundColor Green
}

# Vérifier si l'utilisateur est connecté à Firebase
Write-Host "`nVérification de la connexion Firebase..." -ForegroundColor Yellow
try {
    $firebaseUser = npx firebase login:list 2>&1
    if ($firebaseUser -match "No authorized accounts" -or $firebaseUser -match "not found") {
        Write-Host "Vous n'êtes pas connecté à Firebase." -ForegroundColor Yellow
        Write-Host "Lancement de la connexion..." -ForegroundColor Yellow
        npx firebase login
    } else {
        Write-Host "Vous êtes connecté à Firebase!" -ForegroundColor Green
    }
} catch {
    Write-Host "Vérification de la connexion..." -ForegroundColor Yellow
    npx firebase login
}

# Vérifier si le projet Firebase est initialisé
Write-Host "`nVérification de la configuration du projet..." -ForegroundColor Yellow
if (Test-Path ".firebaserc") {
    Write-Host "Projet Firebase configuré!" -ForegroundColor Green
    $firebaseConfig = Get-Content .firebaserc | ConvertFrom-Json
    Write-Host "Projet: $($firebaseConfig.projects.default)" -ForegroundColor Cyan
} else {
    Write-Host "Le projet Firebase n'est pas encore initialisé." -ForegroundColor Yellow
    Write-Host "Le fichier .firebaserc existe déjà avec le projet 'continental-d2f6e'" -ForegroundColor Cyan
}

# Déployer les règles Firestore
Write-Host "`n=== Déploiement des Security Rules ===" -ForegroundColor Cyan
npx firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Security Rules déployées avec succès!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Erreur lors du déploiement des Security Rules" -ForegroundColor Red
    Write-Host "Vérifiez que vous êtes connecté: npx firebase login" -ForegroundColor Yellow
    exit 1
}

# Déployer les index Firestore
Write-Host "`n=== Déploiement des Index Firestore ===" -ForegroundColor Cyan
npx firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Index Firestore déployés avec succès!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Erreur lors du déploiement des Index" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Configuration terminée! ===" -ForegroundColor Green
Write-Host "Vous pouvez maintenant utiliser l'application." -ForegroundColor Cyan
Write-Host "`nNote: Utilisez 'npx firebase' au lieu de 'firebase' pour les commandes." -ForegroundColor Yellow
