# Script PowerShell pour générer les APK
# Usage: .\generate-apk.ps1

Write-Host "🔨 Building Client App..." -ForegroundColor Cyan
Set-Location apps\client
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed for client app" -ForegroundColor Red
    exit 1
}
npx cap sync android
Set-Location ..\..

Write-Host "🔨 Building Manager App..." -ForegroundColor Cyan
Set-Location apps\manager
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed for manager app" -ForegroundColor Red
    exit 1
}
npx cap sync android
Set-Location ..\..

Write-Host "✅ Builds completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Next steps:" -ForegroundColor Yellow
Write-Host "1. Open Android Studio" -ForegroundColor White
Write-Host "2. For Client: cd apps\client && npx cap open android" -ForegroundColor White
Write-Host "3. For Manager: cd apps\manager && npx cap open android" -ForegroundColor White
Write-Host "4. In Android Studio: Build > Generate Signed Bundle / APK" -ForegroundColor White
