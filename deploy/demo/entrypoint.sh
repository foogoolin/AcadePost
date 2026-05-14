#!/usr/bin/env sh
set -eu

mkdir -p /uploads /config

echo "[acadepost-demo] Waiting for Temporal on ${TEMPORAL_ADDRESS:-temporal:7233}..."
TEMPORAL_HOST="$(printf '%s' "${TEMPORAL_ADDRESS:-temporal:7233}" | cut -d: -f1)"
TEMPORAL_PORT="$(printf '%s' "${TEMPORAL_ADDRESS:-temporal:7233}" | cut -d: -f2)"
until nc -z "${TEMPORAL_HOST}" "${TEMPORAL_PORT}"; do
  sleep 2
done

if [ "${ACADEPOST_DEMO_DB_PUSH:-true}" = "true" ]; then
  echo "[acadepost-demo] Synchronizing Prisma schema with demo database..."
  corepack pnpm exec prisma db push --accept-data-loss --schema ./libraries/nestjs-libraries/src/database/prisma/schema.prisma
fi

echo "[acadepost-demo] Validating nginx configuration..."
nginx -t

echo "[acadepost-demo] Starting nginx..."
nginx

echo "[acadepost-demo] Starting AcadéPost demo services..."
exec pm2-runtime ecosystem.demo.config.cjs
