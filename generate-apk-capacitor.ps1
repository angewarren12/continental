# Script pour générer les APK avec Capacitor
# Ce script ouvre Android Studio pour générer les APK

Write-Host "🚀 Génération des APK avec Capacitor" -ForegroundColor Cyan
Write-Host ""

# Fonction pour générer l'APK d'une app
function Generate-App-APK {
    param (
        [string]$appName,
        [string]$appPath
    )

    Write-Host "📱 Préparation de l'application $appName..." -ForegroundColor Yellow
    Set-Location $appPath

    # Vérifier que le build existe
    if (-not (Test-Path "dist")) {
        Write-Host "  ⚠️  Le dossier dist n'existe pas. Build de l'application..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ❌ Erreur lors du build de $appName" -ForegroundColor Red
            return $false
        }
    }

    # Synchroniser Capacitor
    Write-Host "  🔄 Synchronisation avec Capacitor..." -ForegroundColor Yellow
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Erreur lors de la synchronisation Capacitor" -ForegroundColor Red
        return $false
    }

    # Ouvrir Android Studio
    Write-Host "  🎯 Ouverture d'Android Studio pour $appName..." -ForegroundColor Green
    Write-Host "  📝 Instructions:" -ForegroundColor Cyan
    Write-Host "     1. Dans Android Studio, allez dans Build → Generate Signed Bundle / APK" -ForegroundColor White
    Write-Host "     2. Sélectionnez APK" -ForegroundColor White
    Write-Host "     3. Créez un keystore ou utilisez un existant" -ForegroundColor White
    Write-Host "     4. Sélectionnez 'release' comme build variant" -ForegroundColor White
    Write-Host "     5. Cliquez sur Finish" -ForegroundColor White
    Write-Host ""
    
    npx cap open android
    
    Write-Host "  ✅ Android Studio ouvert pour $appName" -ForegroundColor Green
    Write-Host ""
    
    return $true
}

# Chemin racine du projet
$projectRoot = Get-Location

# Générer l'APK pour l'application client
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
$clientSuccess = Generate-App-APK -appName "Client App" -appPath (Join-Path $projectRoot "apps/client")

if ($clientSuccess) {
    Write-Host "✅ Application Client prête pour la génération d'APK" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la préparation de l'application Client" -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Générer l'APK pour l'application manager
$managerSuccess = Generate-App-APK -appName "Manager App" -appPath (Join-Path $projectRoot "apps/manager")

if ($managerSuccess) {
    Write-Host "✅ Application Manager prête pour la génération d'APK" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la préparation de l'application Manager" -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 Processus terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Les deux projets Android Studio ont été ouverts." -ForegroundColor Cyan
Write-Host "📌 Suivez les instructions dans Android Studio pour générer les APK signés." -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Astuce: Les APK seront générés dans:" -ForegroundColor Yellow
Write-Host "   - apps/client/android/app/release/app-release.apk" -ForegroundColor White
Write-Host "   - apps/manager/android/app/release/app-release.apk" -ForegroundColor White
