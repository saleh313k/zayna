#!/usr/bin/env bash
# Deploy / update the stack from the code currently checked out in this directory.
# Builds new images, shows pending database migrations, asks before applying them (after a backup), restarts.
#   deploy/scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

[ -f .env ] || { echo "ERROR: .env not found (see docs/DEPLOYMENT.md)." >&2; exit 1; }
set -a
# shellcheck disable=SC1091
. ./.env
set +a

COMPOSE=(docker compose --env-file .env -f docker-compose.prod.yml)
export APP_VERSION
APP_VERSION="$(git rev-parse --short HEAD 2>/dev/null || date -u +%Y%m%d%H%M%S)"
echo "Deploying version: ${APP_VERSION}"

echo "[1/5] Building images..."
"${COMPOSE[@]}" build

echo "[2/5] Making sure the database is running..."
"${COMPOSE[@]}" up -d db

echo "[3/5] Checking for database changes (read-only)..."
PENDING_OUTPUT="$("${COMPOSE[@]}" run --rm --no-deps -T api --pending)" || {
  echo "$PENDING_OUTPUT" >&2
  echo "ERROR: could not read the database state. Nothing was changed." >&2
  exit 1
}
echo "$PENDING_OUTPUT"

if ! grep -q "Pending migrations: none" <<<"$PENDING_OUTPUT"; then
  echo
  echo "These database changes will be applied. A backup is taken first."
  read -r -p "Apply them now? Type yes to continue: " answer
  [ "$answer" = "yes" ] || { echo "Aborted. Nothing was changed."; exit 1; }
  deploy/scripts/backup.sh
  echo "[4/5] Applying migrations..."
  "${COMPOSE[@]}" run --rm --no-deps -T api --migrate
else
  echo "[4/5] No migrations to apply."
  # Still ensures the admin account from ADMIN_EMAIL exists (idempotent, changes no schema).
  "${COMPOSE[@]}" run --rm --no-deps -T api --migrate >/dev/null
fi

echo "[5/5] Starting the new version..."
"${COMPOSE[@]}" up -d

echo "Waiting for the API to report ready..."
ok=""
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "https://${DOMAIN}/health/ready" 2>/dev/null; then ok=yes; break; fi
  sleep 3
done
if [ -n "$ok" ]; then
  echo "${APP_VERSION} $(date -u +%FT%TZ)" >> .deploy-history
  docker image prune -f >/dev/null   # removes only dangling layers; tagged versions are kept for rollback
  echo "OK: https://${DOMAIN}/health/ready is healthy. Version ${APP_VERSION} is live."
else
  echo "WARNING: the health check did not pass within 90s (DNS/HTTPS may still be propagating on a first deploy)." >&2
  echo "Check:  docker compose -f docker-compose.prod.yml ps   and   ... logs --tail 100 api web" >&2
  exit 1
fi
