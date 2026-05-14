#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

ENV_FILE="${ENV_FILE:-.env.demo}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.demo.yaml}"

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

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker Engine with the Compose plugin first." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is not available. Install the docker compose plugin first." >&2
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  cp .env.demo.example "${ENV_FILE}"
  echo "Created ${ENV_FILE} from .env.demo.example."
fi

if [ -n "${ACADEPOST_PUBLIC_URL:-}" ]; then
  replace_env_value "ACADEPOST_PUBLIC_URL" "${ACADEPOST_PUBLIC_URL}" "${ENV_FILE}"
fi

if grep '^ACADEPOST_PUBLIC_URL=' "${ENV_FILE}" | grep -q "YOUR_SERVER_IP"; then
  echo "Set ACADEPOST_PUBLIC_URL before starting the demo." >&2
  echo "Example:" >&2
  echo "  ACADEPOST_PUBLIC_URL=http://YOUR_SERVER_IP:4007 bash deploy/demo/server-up.sh" >&2
  exit 1
fi

PUBLIC_URL="$(grep '^ACADEPOST_PUBLIC_URL=' "${ENV_FILE}" | cut -d= -f2- | sed 's:/*$::')"
BACKEND_URL="${PUBLIC_URL}/api"
if ! grep -q '^NEXT_PUBLIC_BACKEND_URL=' "${ENV_FILE}" || grep '^NEXT_PUBLIC_BACKEND_URL=' "${ENV_FILE}" | grep -q 'YOUR_SERVER_IP'; then
  replace_env_value "NEXT_PUBLIC_BACKEND_URL" "${BACKEND_URL}" "${ENV_FILE}"
fi

if grep -q "change-this-demo-postgres-password" "${ENV_FILE}"; then
  replace_env_value "POSTGRES_PASSWORD" "$(random_secret)" "${ENV_FILE}"
fi

if grep -q "change-this-demo-temporal-password" "${ENV_FILE}"; then
  replace_env_value "TEMPORAL_POSTGRES_PASSWORD" "$(random_secret)" "${ENV_FILE}"
fi

if grep -q "change-this-demo-jwt-secret-use-a-long-random-string" "${ENV_FILE}"; then
  replace_env_value "JWT_SECRET" "$(random_secret)" "${ENV_FILE}"
fi

echo "Validating ${COMPOSE_FILE}..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" config --quiet

echo "Starting AcadePost demo stack..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build

echo "Current stack status:"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps

echo "Demo URL:"
grep '^ACADEPOST_PUBLIC_URL=' "${ENV_FILE}" | cut -d= -f2-
