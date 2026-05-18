#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

ENV_FILE="${ENV_FILE:-.env.demo.shared-infra}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.demo.shared-infra.yaml}"
APP_SERVICES="${APP_SERVICES:-acadepost-migrate acadepost-backend acadepost-frontend acadepost-orchestrator acadepost}"

replace_env_value() {
  local key="$1"
  local value="$2"
  local file="$3"

  if grep -q "^${key}=" "${file}"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${file}"
  else
    printf '\n%s=%s\n' "${key}" "${value}" >> "${file}"
  fi
}

random_secret() {
  openssl rand -hex 32
}

require_network() {
  local network="$1"
  if ! docker network inspect "${network}" >/dev/null 2>&1; then
    echo "Missing external Docker network: ${network}" >&2
    exit 1
  fi
}

fix_elasticsearch_permissions() {
  local dir="$1"

  if [ "$(id -u)" -eq 0 ]; then
    chown -R 1000:1000 "${dir}"
    chmod -R u+rwX,g+rwX "${dir}"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo chown -R 1000:1000 "${dir}"
    sudo chmod -R u+rwX,g+rwX "${dir}"
    return
  fi

  echo "Warning: cannot adjust ${dir} ownership. Elasticsearch needs write access for uid 1000." >&2
}

fix_app_permissions() {
  local dir="$1"

  if [ "$(id -u)" -eq 0 ]; then
    chown -R 10001:10001 "${dir}"
    chmod -R u+rwX,g+rwX "${dir}"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo chown -R 10001:10001 "${dir}"
    sudo chmod -R u+rwX,g+rwX "${dir}"
    return
  fi

  echo "Warning: cannot adjust ${dir} ownership. AcadéPost app containers need write access for uid 10001." >&2
}

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker Engine with the Compose plugin first." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is not available. Install the docker compose plugin first." >&2
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  cp .env.demo.shared-infra.example "${ENV_FILE}"
  echo "Created ${ENV_FILE} from .env.demo.shared-infra.example."
fi

if [ -n "${ACADEPOST_PUBLIC_URL:-}" ]; then
  replace_env_value "ACADEPOST_PUBLIC_URL" "${ACADEPOST_PUBLIC_URL}" "${ENV_FILE}"
fi

if grep '^ACADEPOST_PUBLIC_URL=' "${ENV_FILE}" | grep -q "https://YOUR_DOMAIN"; then
  echo "Set ACADEPOST_PUBLIC_URL before starting the shared-infra demo." >&2
  echo "Example:" >&2
  echo "  ACADEPOST_PUBLIC_URL=https://example.com bash deploy/demo/server-up-shared-infra.sh" >&2
  exit 1
fi

PUBLIC_URL="$(grep '^ACADEPOST_PUBLIC_URL=' "${ENV_FILE}" | cut -d= -f2- | sed 's:/*$::')"
BACKEND_URL="${PUBLIC_URL}/api"
if ! grep -q '^NEXT_PUBLIC_BACKEND_URL=' "${ENV_FILE}" || grep '^NEXT_PUBLIC_BACKEND_URL=' "${ENV_FILE}" | grep -q 'https://YOUR_DOMAIN/api'; then
  replace_env_value "NEXT_PUBLIC_BACKEND_URL" "${BACKEND_URL}" "${ENV_FILE}"
fi

if grep -q "CHANGE_ME_LONG_RANDOM_JWT_SECRET" "${ENV_FILE}"; then
  replace_env_value "JWT_SECRET" "$(random_secret)" "${ENV_FILE}"
fi

if grep -q "CHANGE_ME_CREDENTIALS_ENCRYPTION_KEY" "${ENV_FILE}"; then
  replace_env_value "ACADEPOST_CREDENTIALS_ENCRYPTION_KEY" "$(random_secret)" "${ENV_FILE}"
fi

if grep -q "CHANGE_ME_APP_DB_PASSWORD" "${ENV_FILE}"; then
  echo "DATABASE_URL still contains CHANGE_ME_APP_DB_PASSWORD. Create the shared Postgres DB/user and set DATABASE_URL first." >&2
  exit 1
fi

if grep -q "CHANGE_ME_TEMPORAL_DB_PASSWORD" "${ENV_FILE}"; then
  echo "TEMPORAL_POSTGRES_PASSWORD still contains CHANGE_ME_TEMPORAL_DB_PASSWORD. Create the shared Temporal DB/user and set it first." >&2
  exit 1
fi

PROXY_NETWORK="$(grep '^PROXY_NETWORK=' "${ENV_FILE}" | cut -d= -f2-)"
BACKEND_NETWORK="$(grep '^BACKEND_NETWORK=' "${ENV_FILE}" | cut -d= -f2-)"
require_network "${PROXY_NETWORK:-proxy}"
require_network "${BACKEND_NETWORK:-backend}"

DATA_DIR="$(grep '^ACADEPOST_DATA_DIR=' "${ENV_FILE}" | cut -d= -f2-)"
mkdir -p "${DATA_DIR:-./data}/config" "${DATA_DIR:-./data}/uploads" "${DATA_DIR:-./data}/redis" "${DATA_DIR:-./data}/temporal-elasticsearch"
fix_app_permissions "${DATA_DIR:-./data}/config"
fix_app_permissions "${DATA_DIR:-./data}/uploads"
fix_elasticsearch_permissions "${DATA_DIR:-./data}/temporal-elasticsearch"

echo "Validating ${COMPOSE_FILE}..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" config --quiet

echo "Pulling AcadePost images..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" pull ${APP_SERVICES}

echo "Starting AcadePost shared-infra demo stack..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --no-build

echo "Current stack status:"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps

echo "Demo URL:"
grep '^ACADEPOST_PUBLIC_URL=' "${ENV_FILE}" | cut -d= -f2-

echo "Caddy upstream, if Caddy is attached to the proxy network:"
echo "  reverse_proxy acadepost:5000"
