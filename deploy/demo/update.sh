#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.demo.shared-infra}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.demo.shared-infra.yaml}"
SERVICES="${SERVICES:-acadepost-migrate acadepost-backend acadepost-frontend acadepost-orchestrator acadepost}"
HEALTH_PATH="${ACADEPOST_HEALTH_PATH:-/api/monitor/ready}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_FILE="$2"
      shift 2
      ;;
    --compose)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --service)
      SERVICES="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

PUBLIC_URL="${ACADEPOST_PUBLIC_URL:-http://127.0.0.1:4007}"
PUBLIC_URL="${PUBLIC_URL%/}"

previous_container_id="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q acadepost-backend 2>/dev/null || true)"
if [[ -z "$previous_container_id" ]]; then
  previous_container_id="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q acadepost 2>/dev/null || true)"
fi
previous_image=""
previous_digest=""
if [[ -n "$previous_container_id" ]]; then
  previous_image="$(docker inspect --format '{{.Config.Image}}' "$previous_container_id" 2>/dev/null || true)"
  if [[ -n "$previous_image" ]]; then
    previous_digest="$(docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$previous_image" 2>/dev/null | head -n 1 || true)"
  fi
fi

echo "Validating Compose..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --quiet
configured_services="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --services)"
selected_services=""
for candidate in $SERVICES; do
  if printf '%s\n' "$configured_services" | grep -qx "$candidate"; then
    selected_services="${selected_services} ${candidate}"
  fi
done

if [[ -z "${selected_services// }" ]]; then
  if printf '%s\n' "$configured_services" | grep -qx "acadepost"; then
    selected_services="acadepost"
  else
    echo "None of the requested services exist in Compose: $SERVICES" >&2
    exit 1
  fi
fi

if [[ "${ACADEPOST_IMAGE:-}" == *":demo" || "${ACADEPOST_IMAGE:-}" == *":latest" ]]; then
  echo "Warning: ACADEPOST_IMAGE uses a mutable tag. Use a SHA tag or digest for pinned production rollback."
fi

echo "Pulling images for services:${selected_services}"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull $selected_services

echo "Recreating services without local build:${selected_services}"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --no-build --force-recreate $selected_services

echo "Waiting for selected service health..."
for service in $selected_services; do
  for attempt in $(seq 1 60); do
    service_container_id="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null || true)"
    if [[ -z "$service_container_id" ]]; then
      if [[ "$attempt" == "60" ]]; then
        echo "Service did not create a container: $service" >&2
        docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
        exit 1
      fi

      sleep 3
      continue
    fi

    state="$(docker inspect --format '{{.State.Status}}' "$service_container_id")"
    exit_code="$(docker inspect --format '{{.State.ExitCode}}' "$service_container_id")"
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$service_container_id")"

    if [[ "$health" == "healthy" ]]; then
      break
    fi

    if [[ -z "$health" && "$state" == "running" ]]; then
      break
    fi

    if [[ "$state" == "exited" && "$exit_code" == "0" ]]; then
      break
    fi

    if [[ "$health" == "unhealthy" || "$state" == "exited" || "$state" == "dead" ]]; then
      echo "Service failed health gate: $service (state=$state health=${health:-none} exit=$exit_code)" >&2
      docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
      docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=160 "$service"
      exit 1
    fi

    if [[ "$attempt" == "60" ]]; then
      echo "Service did not become healthy: $service (state=$state health=${health:-none} exit=$exit_code)" >&2
      docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
      docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=160 "$service"
      exit 1
    fi

    sleep 3
  done
done

echo "Waiting for health: $PUBLIC_URL$HEALTH_PATH"
for attempt in $(seq 1 60); do
  if curl -fsS "$PUBLIC_URL$HEALTH_PATH" >/dev/null 2>&1; then
    echo "AcadePost is ready."
    break
  fi

  if [[ "$attempt" == "60" ]]; then
    echo "Health check failed after 60 attempts." >&2
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=120 $selected_services
    exit 1
  fi

  sleep 3
done

container_id="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q acadepost 2>/dev/null || true)"
echo "Public container: ${container_id:-unknown}"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" images $selected_services

for service in $selected_services; do
  service_container_id="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null || true)"
  if [[ -n "$service_container_id" ]]; then
    image_id="$(docker inspect --format '{{.Image}}' "$service_container_id")"
    image_name="$(docker inspect --format '{{.Config.Image}}' "$service_container_id")"
    echo "$service image: $image_name"
    echo "$service image ID: $image_id"
  fi
done

cat <<EOF

Rollback:
  1. Set ACADEPOST_IMAGE in $ENV_FILE to a previous GHCR sha tag or digest.
     Previous image: ${previous_image:-unknown}
     Previous digest: ${previous_digest:-unknown}
  2. Run:
     bash deploy/demo/update.sh --env "$ENV_FILE" --compose "$COMPOSE_FILE"

EOF
