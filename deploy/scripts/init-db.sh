#!/usr/bin/env bash
# One-time (re-runnable) database setup: creates ZaynaDB and the least-privilege application login.
# Run from anywhere:   deploy/scripts/init-db.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

[ -f .env ] || { echo "ERROR: .env not found. Copy .env.production.example to .env and fill it in first." >&2; exit 1; }
set -a
# shellcheck disable=SC1091
. ./.env
set +a
: "${DB_SA_PASSWORD:?DB_SA_PASSWORD is not set in .env}"
: "${DB_APP_PASSWORD:?DB_APP_PASSWORD is not set in .env}"

# The password is placed inside a SQL string, so only a safe character set is allowed.
if [[ ! "$DB_APP_PASSWORD" =~ ^[A-Za-z0-9._-]{16,}$ ]]; then
  echo "ERROR: DB_APP_PASSWORD must be at least 16 characters and contain only letters, digits, '.', '_' or '-'." >&2
  echo "       Generate one with:  openssl rand -hex 24" >&2
  exit 1
fi

COMPOSE=(docker compose --env-file .env -f docker-compose.prod.yml)

echo "Starting the database container..."
"${COMPOSE[@]}" up -d db

echo "Waiting for the database to become healthy (this can take up to a few minutes on the first start)..."
status="starting"
for _ in $(seq 1 60); do
  cid="$("${COMPOSE[@]}" ps -q db)"
  status="$(docker inspect --format '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo starting)"
  [ "$status" = "healthy" ] && break
  sleep 5
done
if [ "$status" != "healthy" ]; then
  echo "ERROR: the database did not become healthy. Check:  docker compose -f docker-compose.prod.yml logs db" >&2
  exit 1
fi

echo "Creating the database and application login..."
# The variables below are meant to expand INSIDE the container (single quotes are intentional).
# shellcheck disable=SC2016
"${COMPOSE[@]}" exec -T -e APP_PASSWORD="$DB_APP_PASSWORD" db sh -c \
  '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -v APP_PASSWORD="$APP_PASSWORD" -i /dev/stdin' \
  < deploy/sql/init-db.sql

echo "Done. Next step: apply the schema (see docs/DEPLOYMENT.md, 'First deployment')."
