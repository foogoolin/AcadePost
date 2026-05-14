#!/usr/bin/env bash

set -euo pipefail

IMAGE="${ACADEPOST_IMAGE:-acadepost/app:demo}"
VERSION="${NEXT_PUBLIC_VERSION:-$(git rev-parse --short HEAD 2>/dev/null || echo demo)}"
NODE_BUILD_MAX_OLD_SPACE_SIZE="${NODE_BUILD_MAX_OLD_SPACE_SIZE:-4096}"

docker build \
  --build-arg NEXT_PUBLIC_VERSION="${VERSION}" \
  --build-arg NODE_BUILD_MAX_OLD_SPACE_SIZE="${NODE_BUILD_MAX_OLD_SPACE_SIZE}" \
  -t "${IMAGE}" \
  -f Dockerfile.demo .
