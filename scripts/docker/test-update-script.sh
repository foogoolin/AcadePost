#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

mkdir -p "${TMP_DIR}/bin"
LOG_FILE="${TMP_DIR}/docker.log"
ENV_FILE="${TMP_DIR}/.env.demo"
COMPOSE_FILE="${TMP_DIR}/docker-compose.demo.yaml"

cat > "${ENV_FILE}" <<'ENV'
ACADEPOST_PUBLIC_URL=http://127.0.0.1:4007
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4007/api
ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:test
ENV

cat > "${COMPOSE_FILE}" <<'YAML'
services: {}
YAML

cat > "${TMP_DIR}/bin/docker" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
echo "docker $*" >> "${UPDATE_TEST_LOG}"

if [[ "$*" == *"config --quiet"* ]]; then
  exit 0
fi

if [[ "$*" == *"config --services"* ]]; then
  printf '%s\n' acadepost-migrate acadepost-backend acadepost-frontend acadepost-orchestrator acadepost
  exit 0
fi

if [[ "$*" == *" ps -q "* ]]; then
  exit 0
fi

if [[ "$*" == *" pull "* ]]; then
  exit 42
fi

if [[ "$*" == *" up "* ]]; then
  echo "ERROR: up must not run after pull failure" >&2
  exit 99
fi

exit 0
SH
chmod +x "${TMP_DIR}/bin/docker"

set +e
UPDATE_TEST_LOG="${LOG_FILE}" PATH="${TMP_DIR}/bin:${PATH}" \
  bash "${ROOT_DIR}/deploy/demo/update.sh" --env "${ENV_FILE}" --compose "${COMPOSE_FILE}" >/tmp/acadepost-update-test.out 2>/tmp/acadepost-update-test.err
status=$?
set -e

if [[ "$status" -eq 0 ]]; then
  echo "update.sh should fail when docker compose pull fails" >&2
  exit 1
fi

if grep -q " up " "${LOG_FILE}"; then
  echo "update.sh called docker compose up after pull failed" >&2
  cat "${LOG_FILE}" >&2
  exit 1
fi

echo "update.sh pull-failure gate ok"
