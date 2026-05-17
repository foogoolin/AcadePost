#!/usr/bin/env sh
set -eu

mkdir -p /uploads /config

wait_for_tcp() {
  name="$1"
  host="$2"
  port="$3"

  echo "[acadepost] Waiting for ${name} on ${host}:${port}..."
  until nc -z "${host}" "${port}"; do
    sleep 2
  done
}

if [ -n "${DATABASE_URL:-}" ]; then
  DB_HOST="$(node -e "const u=new URL(process.env.DATABASE_URL); console.log(u.hostname)")"
  DB_PORT="$(node -e "const u=new URL(process.env.DATABASE_URL); console.log(u.port || '5432')")"
  wait_for_tcp "PostgreSQL" "${DB_HOST}" "${DB_PORT}"
fi

if [ -n "${REDIS_URL:-}" ]; then
  REDIS_HOST="$(node -e "const u=new URL(process.env.REDIS_URL); console.log(u.hostname)")"
  REDIS_PORT="$(node -e "const u=new URL(process.env.REDIS_URL); console.log(u.port || '6379')")"
  wait_for_tcp "Redis" "${REDIS_HOST}" "${REDIS_PORT}"
fi

echo "[acadepost] Waiting for Temporal on ${TEMPORAL_ADDRESS:-temporal:7233}..."
TEMPORAL_HOST="$(printf '%s' "${TEMPORAL_ADDRESS:-temporal:7233}" | cut -d: -f1)"
TEMPORAL_PORT="$(printf '%s' "${TEMPORAL_ADDRESS:-temporal:7233}" | cut -d: -f2)"
wait_for_tcp "Temporal" "${TEMPORAL_HOST}" "${TEMPORAL_PORT}"

if [ "${ACADEPOST_DEMO_DB_PUSH:-true}" = "true" ]; then
  echo "[acadepost] Synchronizing Prisma schema with database..."
  corepack pnpm exec prisma db push --accept-data-loss --schema ./libraries/nestjs-libraries/src/database/prisma/schema.prisma
fi

echo "[acadepost] Validating nginx configuration..."
nginx -t

echo "[acadepost] Starting nginx..."
nginx

echo "[acadepost] Starting services..."
exec pm2-runtime ecosystem.demo.config.cjs
