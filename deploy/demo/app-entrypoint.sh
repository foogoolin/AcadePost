#!/usr/bin/env sh
set -eu

ROLE="${1:-backend}"

mkdir -p /uploads /config

wait_for_tcp() {
  name="$1"
  host="$2"
  port="$3"

  echo "[acadepost:${ROLE}] Waiting for ${name} on ${host}:${port}..."
  until nc -z "${host}" "${port}"; do
    sleep 2
  done
}

wait_for_url() {
  name="$1"
  url="$2"

  echo "[acadepost:${ROLE}] Waiting for ${name} at ${url}..."
  until node -e "fetch(process.argv[1]).then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" "${url}"; do
    sleep 2
  done
}

wait_for_database() {
  if [ -n "${DATABASE_URL:-}" ]; then
    DB_HOST="$(node -e "const u=new URL(process.env.DATABASE_URL); console.log(u.hostname)")"
    DB_PORT="$(node -e "const u=new URL(process.env.DATABASE_URL); console.log(u.port || '5432')")"
    wait_for_tcp "PostgreSQL" "${DB_HOST}" "${DB_PORT}"
  fi
}

wait_for_redis() {
  if [ -n "${REDIS_URL:-}" ]; then
    REDIS_HOST="$(node -e "const u=new URL(process.env.REDIS_URL); console.log(u.hostname)")"
    REDIS_PORT="$(node -e "const u=new URL(process.env.REDIS_URL); console.log(u.port || '6379')")"
    wait_for_tcp "Redis" "${REDIS_HOST}" "${REDIS_PORT}"
  fi
}

wait_for_temporal() {
  TEMPORAL_VALUE="${TEMPORAL_ADDRESS:-temporal:7233}"
  TEMPORAL_HOST="$(printf '%s' "${TEMPORAL_VALUE}" | cut -d: -f1)"
  TEMPORAL_PORT="$(printf '%s' "${TEMPORAL_VALUE}" | cut -d: -f2)"
  wait_for_tcp "Temporal" "${TEMPORAL_HOST}" "${TEMPORAL_PORT}"
}

case "${ROLE}" in
  migrate)
    wait_for_database
    if [ "${ACADEPOST_DEMO_DB_PUSH:-false}" = "true" ]; then
      echo "[acadepost:migrate] Synchronizing Prisma schema with database..."
      node /app/node_modules/prisma/build/index.js db push --accept-data-loss --schema ./libraries/nestjs-libraries/src/database/prisma/schema.prisma
    else
      echo "[acadepost:migrate] ACADEPOST_DEMO_DB_PUSH is not true; skipping Prisma db push."
    fi
    ;;
  backend)
    wait_for_database
    wait_for_redis
    wait_for_temporal
    echo "[acadepost:backend] Starting backend on port ${PORT:-3000}..."
    exec node --experimental-require-module /app/apps/backend/dist/apps/backend/src/main.js
    ;;
  orchestrator)
    wait_for_database
    wait_for_redis
    wait_for_temporal
    wait_for_url "backend readiness" "${BACKEND_HEALTH_URL:-http://acadepost-backend:3000/monitor/ready}"
    echo "[acadepost:orchestrator] Starting orchestrator on port ${ORCHESTRATOR_PORT:-3002}..."
    exec node --experimental-require-module /app/apps/orchestrator/dist/apps/orchestrator/src/main.js
    ;;
  frontend)
    FRONTEND_DIR="/app/frontend-standalone/apps/frontend"
    if [ ! -f "${FRONTEND_DIR}/server.js" ]; then
      FRONTEND_DIR="/app/frontend-standalone"
    fi

    echo "[acadepost:frontend] Starting frontend on port ${PORT:-4200}..."
    cd "${FRONTEND_DIR}"
    exec node server.js
    ;;
  *)
    echo "Unknown AcadePost role: ${ROLE}" >&2
    exit 1
    ;;
esac
