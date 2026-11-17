#!/usr/bin/env bash
# Full backup of ZaynaDB -> backups/zaynadb_<UTC timestamp>.bak.gz, verified, with old copies pruned.
# Run by hand or from cron:   deploy/scripts/backup.sh
# Optional off-server copy: set BACKUP_RCLONE_REMOTE in .env (an rclone remote you configured with `rclone config`).
set -euo pipefail
cd "$(dirname "$0")/../.."
umask 077

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
COMPOSE=(docker compose --env-file .env -f docker-compose.prod.yml)

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="zaynadb_${STAMP}.bak"
IN_CONTAINER="/var/opt/mssql/backup/${FILE}"
mkdir -p backups

sql() {
  "${COMPOSE[@]}" exec -T db sh -c "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P \"\$MSSQL_SA_PASSWORD\" -C -b -Q \"$1\""
}

"${COMPOSE[@]}" exec -T db mkdir -p /var/opt/mssql/backup
echo "Backing up ZaynaDB..."
sql "BACKUP DATABASE [ZaynaDB] TO DISK = N'${IN_CONTAINER}' WITH CHECKSUM, INIT"
echo "Verifying the backup file..."
sql "RESTORE VERIFYONLY FROM DISK = N'${IN_CONTAINER}' WITH CHECKSUM"

"${COMPOSE[@]}" cp "db:${IN_CONTAINER}" "backups/${FILE}"
"${COMPOSE[@]}" exec -T db rm -f "${IN_CONTAINER}"
gzip -f "backups/${FILE}"
echo "Backup written: backups/${FILE}.gz ($(du -h "backups/${FILE}.gz" | cut -f1))"

if [ -n "${BACKUP_RCLONE_REMOTE:-}" ]; then
  if command -v rclone >/dev/null 2>&1; then
    rclone copy "backups/${FILE}.gz" "${BACKUP_RCLONE_REMOTE}" && echo "Copied off-server to ${BACKUP_RCLONE_REMOTE}"
  else
    echo "WARNING: BACKUP_RCLONE_REMOTE is set but rclone is not installed; no off-server copy was made." >&2
  fi
else
  echo "NOTE: no off-server copy configured (BACKUP_RCLONE_REMOTE). A backup that lives only on this server is not a safe backup."
fi

find backups -name 'zaynadb_*.bak.gz' -mtime "+${KEEP_DAYS}" -print -delete | sed 's/^/Pruned old backup: /'
