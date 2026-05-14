#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.demo}"

if [ ! -f "${ENV_FILE}" ]; then
  echo "Missing ${ENV_FILE}. Copy .env.demo.example to ${ENV_FILE} and edit it first." >&2
  exit 1
fi

docker compose --env-file "${ENV_FILE}" -f docker-compose.demo.yaml up -d --build
