#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.demo.shared-infra}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.demo.shared-infra.yaml}"
SERVICE="${SERVICE:-acadepost}"
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
      SERVICE="$2"
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

echo "Validating Compose..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --quiet

echo "Pulling image for service: $SERVICE"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull "$SERVICE"

echo "Recreating $SERVICE without local build..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --no-build --force-recreate "$SERVICE"

echo "Waiting for health: $PUBLIC_URL$HEALTH_PATH"
for attempt in $(seq 1 60); do
  if curl -fsS "$PUBLIC_URL$HEALTH_PATH" >/dev/null 2>&1; then
    echo "AcadéPost is ready."
    break
  fi

  if [[ "$attempt" == "60" ]]; then
    echo "Health check failed after 60 attempts." >&2
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=120 "$SERVICE"
    exit 1
  fi

  sleep 3
done

container_id="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q "$SERVICE")"
echo "Running container: $container_id"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" images "$SERVICE"

if [[ -n "$container_id" ]]; then
  image_id="$(docker inspect --format '{{.Image}}' "$container_id")"
  image_name="$(docker inspect --format '{{.Config.Image}}' "$container_id")"
  echo "Image: $image_name"
  echo "Image ID: $image_id"
fi

cat <<EOF

Rollback:
  1. Set ACADEPOST_IMAGE in $ENV_FILE to a previous GHCR sha tag.
  2. Run:
     bash deploy/demo/update.sh --env "$ENV_FILE" --compose "$COMPOSE_FILE"

EOF
