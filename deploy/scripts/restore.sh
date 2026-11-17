#!/usr/bin/env bash
# DESTRUCTIVE: replaces the current ZaynaDB with the contents of a backup file.
# Usage:   deploy/scripts/restore.sh backups/zaynadb_20260101T020000Z.bak.gz
# A safety backup of the current database is taken first, and you must type a confirmation phrase.
set -euo pipefail
cd "$(dirname "$0")/../.."

FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: $0 <backup file (.bak or .bak.gz)>" >&2
  exit 1
fi
COMPOSE=(docker compose --env-file .env -f docker-compose.prod.yml)

echo "This will REPLACE the live database with: $FILE"
echo "Everything saved after that backup was made will be LOST (a safety backup of the current state is taken first)."
read -r -p "Type RESTORE ZaynaDB to continue: " answer
[ "$answer" = "RESTORE ZaynaDB" ] || { echo "Aborted."; exit 1; }

echo "Taking a safety backup of the current database..."
deploy/scripts/backup.sh

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
if [[ "$FILE" == *.gz ]]; then gunzip -c "$FILE" > "$TMP/restore.bak"; else cp "$FILE" "$TMP/restore.bak"; fi

echo "Stopping the application..."
"${COMPOSE[@]}" stop web api

"${COMPOSE[@]}" exec -T db mkdir -p /var/opt/mssql/backup
"${COMPOSE[@]}" cp "$TMP/restore.bak" db:/var/opt/mssql/backup/restore.bak

echo "Restoring..."
# The SQL below runs inside the container, where $MSSQL_SA_PASSWORD is defined (single quotes are intentional).
# shellcheck disable=SC2016
"${COMPOSE[@]}" exec -T db sh -c '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -Q "
ALTER DATABASE [ZaynaDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [ZaynaDB] FROM DISK = N'"'"'/var/opt/mssql/backup/restore.bak'"'"' WITH REPLACE, RECOVERY;
ALTER DATABASE [ZaynaDB] SET MULTI_USER;"'
"${COMPOSE[@]}" exec -T db rm -f /var/opt/mssql/backup/restore.bak

echo "Starting the application..."
"${COMPOSE[@]}" up -d api web
echo "Restore finished. Check:  curl -fsS https://\$DOMAIN/health/ready"
