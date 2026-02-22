#!/bin/bash
# Script Bash pour initialiser la base de données MySQL Continental
# Nécessite MySQL installé et accessible via la ligne de commande

set -e

MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3306}"

echo "========================================"
echo "  Initialisation de la base de données"
echo "  Continental (continentalBd)"
echo "========================================"
echo ""

# Vérifier si MySQL est installé
if ! command -v mysql &> /dev/null; then
    echo "ERREUR: MySQL n'est pas installé ou n'est pas dans le PATH"
    echo "Veuillez installer MySQL ou ajouter MySQL au PATH"
    exit 1
fi

echo "MySQL trouvé: $(which mysql)"
echo ""

# Chemin du script SQL
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_SCRIPT="$SCRIPT_DIR/init-database.sql"

if [ ! -f "$SQL_SCRIPT" ]; then
    echo "ERREUR: Fichier SQL introuvable: $SQL_SCRIPT"
    exit 1
fi

echo "Exécution du script SQL: $SQL_SCRIPT"
echo ""

# Construire la commande MySQL
MYSQL_CMD="mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER"

if [ -n "$MYSQL_PASSWORD" ]; then
    MYSQL_CMD="$MYSQL_CMD -p$MYSQL_PASSWORD"
fi

# Exécuter le script SQL
if $MYSQL_CMD < "$SQL_SCRIPT"; then
    echo ""
    echo "✓ Base de données créée avec succès!"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Configurez le fichier .env dans le dossier backend/"
    echo "2. Démarrez le serveur avec: npm run dev"
else
    echo ""
    echo "ERREUR lors de l'exécution du script SQL"
    echo ""
    echo "Vérifiez que:"
    echo "- MySQL est démarré"
    echo "- Les identifiants sont corrects"
    echo "- Vous avez les droits nécessaires"
    exit 1
fi
