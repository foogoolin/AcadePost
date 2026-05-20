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

LOG_FILE_NO_DEPS="${TMP_DIR}/docker-no-deps.log"
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
  printf 'container-id\n'
  exit 0
fi

if [[ "$*" == "inspect --format {{.State.Status}} container-id" ]]; then
  printf 'running\n'
  exit 0
fi

if [[ "$*" == "inspect --format {{.State.ExitCode}} container-id" ]]; then
  printf '0\n'
  exit 0
fi

if [[ "$*" == "inspect --format {{if .State.Health}}{{.State.Health.Status}}{{end}} container-id" ]]; then
  printf 'healthy\n'
  exit 0
fi

if [[ "$*" == "inspect --format {{.Image}} container-id" ]]; then
  printf 'sha256:test\n'
  exit 0
fi

if [[ "$*" == "inspect --format {{.Config.Image}} container-id" ]]; then
  printf 'ghcr.io/foogoolin/acadepost:test\n'
  exit 0
fi

exit 0
SH
chmod +x "${TMP_DIR}/bin/docker"

cat > "${TMP_DIR}/bin/curl" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
echo "curl $*" >> "${UPDATE_TEST_LOG}"
exit 0
SH
chmod +x "${TMP_DIR}/bin/curl"

UPDATE_TEST_LOG="${LOG_FILE_NO_DEPS}" PATH="${TMP_DIR}/bin:${PATH}" \
  ACADEPOST_HEALTH_PATH="/" ACADEPOST_SERVICE_HEALTH_ATTEMPTS=1 \
  bash "${ROOT_DIR}/deploy/demo/update.sh" --env "${ENV_FILE}" --compose "${COMPOSE_FILE}" --no-deps >/tmp/acadepost-update-test-no-deps.out 2>/tmp/acadepost-update-test-no-deps.err

if ! grep -q " up .* --no-deps" "${LOG_FILE_NO_DEPS}"; then
  echo "update.sh did not pass --no-deps to docker compose up" >&2
  cat "${LOG_FILE_NO_DEPS}" >&2
  exit 1
fi

echo "update.sh no-deps gate ok"
