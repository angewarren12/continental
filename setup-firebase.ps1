# Script PowerShell pour installer Firebase CLI et déployer les règles

Write-Host "=== Installation et Configuration Firebase ===" -ForegroundColor Cyan

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

# Vérifier si Firebase CLI est installé
Write-Host "`nVérification de Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version
    Write-Host "Firebase CLI installé: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Firebase CLI n'est pas installé. Installation en cours..." -ForegroundColor Yellow
    npm install -g firebase-tools
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Firebase CLI installé avec succès!" -ForegroundColor Green
    } else {
        Write-Host "ERREUR lors de l'installation de Firebase CLI" -ForegroundColor Red
        exit 1
    }
}

# Vérifier si l'utilisateur est connecté à Firebase
Write-Host "`nVérification de la connexion Firebase..." -ForegroundColor Yellow
try {
    $firebaseUser = firebase login:list 2>&1
    if ($firebaseUser -match "No authorized accounts") {
        Write-Host "Vous n'êtes pas connecté à Firebase." -ForegroundColor Yellow
        Write-Host "Lancement de la connexion..." -ForegroundColor Yellow
        firebase login
    } else {
        Write-Host "Vous êtes connecté à Firebase!" -ForegroundColor Green
    }
} catch {
    Write-Host "Vérification de la connexion..." -ForegroundColor Yellow
}

# Vérifier si le projet Firebase est initialisé
Write-Host "`nVérification de la configuration du projet..." -ForegroundColor Yellow
if (Test-Path ".firebaserc") {
    Write-Host "Projet Firebase configuré!" -ForegroundColor Green
} else {
    Write-Host "Le projet Firebase n'est pas encore initialisé." -ForegroundColor Yellow
    Write-Host "Initialisation du projet..." -ForegroundColor Yellow
    firebase init firestore
}

# Déployer les règles Firestore
Write-Host "`n=== Déploiement des Security Rules ===" -ForegroundColor Cyan
firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Security Rules déployées avec succès!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Erreur lors du déploiement des Security Rules" -ForegroundColor Red
    exit 1
}

# Déployer les index Firestore
Write-Host "`n=== Déploiement des Index Firestore ===" -ForegroundColor Cyan
firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Index Firestore déployés avec succès!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Erreur lors du déploiement des Index" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Configuration terminée! ===" -ForegroundColor Green
Write-Host "Vous pouvez maintenant utiliser l'application." -ForegroundColor Cyan
