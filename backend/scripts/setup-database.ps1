# Script PowerShell pour initialiser la base de données MySQL Continental
# Nécessite MySQL installé et accessible via la ligne de commande

param(
    [string]$MySQLUser = "root",
    [string]$MySQLPassword = "",
    [string]$MySQLHost = "localhost",
    [int]$MySQLPort = 3306
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Initialisation de la base de données" -ForegroundColor Cyan
Write-Host "  Continental (continentalBd)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si MySQL est installé
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlPath) {
    Write-Host "ERREUR: MySQL n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Veuillez installer MySQL ou ajouter MySQL au PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "MySQL trouvé: $($mysqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Construire la commande MySQL
$scriptPath = Join-Path $PSScriptRoot "init-database.sql"
$fullScriptPath = Resolve-Path $scriptPath

if (-not (Test-Path $fullScriptPath)) {
    Write-Host "ERREUR: Fichier SQL introuvable: $fullScriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "Exécution du script SQL: $fullScriptPath" -ForegroundColor Yellow
Write-Host ""

# Construire la commande MySQL
$mysqlCommand = "mysql"
$mysqlArgs = @(
    "-h", $MySQLHost,
    "-P", $MySQLPort.ToString(),
    "-u", $MySQLUser
)

if ($MySQLPassword) {
    $mysqlArgs += "-p$MySQLPassword"
}

# Exécuter le script SQL
try {
    Get-Content $fullScriptPath | & $mysqlCommand $mysqlArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Base de données créée avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Prochaines étapes:" -ForegroundColor Cyan
        Write-Host "1. Configurez le fichier .env dans le dossier backend/" -ForegroundColor White
        Write-Host "2. Démarrez le serveur avec: npm run dev" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "ERREUR lors de l'exécution du script SQL" -ForegroundColor Red
        Write-Host "Code de sortie: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifiez que:" -ForegroundColor Yellow
    Write-Host "- MySQL est démarré" -ForegroundColor White
    Write-Host "- Les identifiants sont corrects" -ForegroundColor White
    Write-Host "- Vous avez les droits nécessaires" -ForegroundColor White
    exit 1
}
