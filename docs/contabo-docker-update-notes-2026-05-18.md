# Contabo Docker Update Notes - 2026-05-18

## Scope

Second server update attempt for AcadéPost on the Contabo host.

Target image:

```text
ghcr.io/foogoolin/acadepost:latest
```

Expected product version in the image: `v1.1.4`.

## Preflight Findings

- SSH alias used: `contabo`.
- Server hostname: `vmi2807410`.
- Server stack path: `/opt/AcadePost`.
- Public health before update: `https://post.fgln.pro/api/monitor/ready` returned `ok`.
- Running app container before update used `ghcr.io/foogoolin/acadepost:demo`.
- Server checkout was stale: `80319f19`.
- Server compose default still referenced `ghcr.io/foogoolin/acadepost:demo`.
- `.env.demo.shared-infra` had `ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:v1.1.0`.
- Runtime and config were therefore inconsistent: env pointed to `v1.1.0`, the running container used `:demo`, and the repository now publishes `:latest` / `v1.1.4`.
- Local server file `deploy/demo/update.sh` was not available in the stale checkout, so the update had to be done with direct `docker compose` commands.

## Actions Taken

- Backed up `/opt/AcadePost/.env.demo.shared-infra` to `.env.demo.shared-infra.bak-20260518-095524`.
- Changed `ACADEPOST_IMAGE` in `.env.demo.shared-infra` to `ghcr.io/foogoolin/acadepost:latest`.
- Validated compose with:

```bash
docker compose --env-file .env.demo.shared-infra \
  -f docker-compose.demo.shared-infra.yaml \
  -f docker-compose.demo.shared-infra.override.yaml \
  config --quiet
```

- Started `docker pull ghcr.io/foogoolin/acadepost:latest` in the background because the MCP command timeout interrupted a foreground pull.
- Pull log path: `/tmp/acadepost-pull-latest.log`.
- Stopped the background pull after roughly 16 minutes with no log progress, by user instruction. The running application container was not recreated.

## Docker / Deploy Shortcomings Observed

- The server copy of the repository can become stale while the image in GHCR is current. This makes server-side scripts unreliable unless the server checkout is updated or the deploy tooling is packaged independently.
- The compose default on the server still points to `:demo`. A stale default can silently pull the wrong image if `ACADEPOST_IMAGE` is missing or overwritten.
- The server still had config drift between `.env.demo.shared-infra` and the actually running container image.
- The image remains too heavy for comfortable VPS updates. Docker showed the existing app image as around `3.48GB` local size, and the pull took long enough to exceed interactive command timeouts.
- New UX pages are not the direct reason for a slow server rollout. If GitHub Actions already built the image, the VPS should only pull changed image layers and recreate the container. A very slow pull means the image/layer strategy is still too heavy or not cache-friendly enough for comfortable updates.
- Server Docker storage is accumulating old data. `docker system df` reported about `29.54GB` images with about `10.87GB` reclaimable and `3.266GB` build cache.
- The current single-image runtime still couples frontend, backend, orchestrator, nginx, PM2, native dependencies and assets. This is simpler for demo install, but still expensive to pull and roll back.
- Pull progress is not observable enough through a normal synchronous SSH command. Background pull with a status file and log gives better visibility for long downloads.

## Follow-up Improvements

- Make the server install/update path independent from a mutable local git checkout, for example a small versioned deploy bundle or a single documented command that only depends on compose + env.
- Keep `ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:latest` in `.env` for normal demo updates, and document pinned SHA/digest rollback.
- Add an explicit remote update script that:
  - writes a timestamped env backup;
  - validates compose;
  - pulls image in a monitored background mode;
  - recreates only the `acadepost` service with `--no-build`;
  - waits for `/api/monitor/ready`;
  - prints previous and new image digests.
- Continue reducing image size. Priority candidates:
  - split frontend/backend/orchestrator into separate images;
  - remove PM2/nginx from the app image if a process supervisor or reverse proxy already exists outside;
  - audit native dependencies and production `node_modules`;
  - avoid shipping unused provider/media/AI dependencies in the minimal demo image.
- Add a safe Docker cleanup runbook for old images/build cache. Do not run cleanup automatically during update until rollback policy is clear.

## Current Status

- Update was aborted before container recreation because `docker pull ghcr.io/foogoolin/acadepost:latest` did not complete in an acceptable time window.
- Existing container remained running and healthy.
- Current running app image on the server remains `ghcr.io/foogoolin/acadepost:demo`.
- `/opt/AcadePost/.env.demo.shared-infra` still points `ACADEPOST_IMAGE` to `ghcr.io/foogoolin/acadepost:latest`; this does not affect the already running container until a future compose recreate.
- The `latest` image did not become available locally on the server during this attempt.
- Public health after abort: `https://post.fgln.pro/api/monitor/ready` returned `ok`.

## Decision

Do not retry the same pull/update loop as-is. The next attempt should first address image size, layer reuse, and the server update workflow, then test pull speed before recreating the application container.

## Local Fix Direction

- Keep `ghcr.io/foogoolin/acadepost:latest` as the normal install tag.
- Build an optimized app image with Next standalone frontend output and traced backend/orchestrator runtime files instead of copying the full root `node_modules`.
- Run backend, frontend and orchestrator as separate internal containers from the same app image.
- Keep only the nginx proxy service on the public `5000` contract.
- Move demo Prisma sync into the one-shot `acadepost-migrate` service.
- Require CI compose checks, image size gate and cold-pull/digest proof before touching Contabo again.

## Resolution After Docker Image Optimization

The optimized image path was implemented and validated later on 2026-05-18.

- Commit `37c79fa5` added Temporal runtime packaging and stricter update/CI service health gates; CI correctly failed before publishing because `tslib` was still missing from Temporal workflow bundling.
- Commit `b4aad511` added the remaining Temporal workflow runtime dependencies: `dayjs`, `lodash` and `tslib`.
- GitHub Actions run `26035055443` passed the Docker image build, size gate, Compose smoke, `acadepost-orchestrator` health check and GHCR publish.
- The Contabo shared-infra host then pulled `ghcr.io/foogoolin/acadepost:latest` and recreated the app/proxy service set without rebuilding on the server.
- Public readiness returned HTTP 200 at `/api/monitor/ready`; `acadepost`, `acadepost-backend`, `acadepost-frontend` and `acadepost-orchestrator` were healthy after the update.
- Running digest recorded from the server: `sha256:0aa076af6444ee1b4e83b32882a859167625292d53322c944c151d226815852c`.
- Reported image size on the server: `1.02GB`.

Remaining follow-up:

- Prebundle Temporal workflows to reduce orchestrator cold start.
- Add an explicit app-only update mode to `deploy/demo/update.sh`, or split first-install and update scripts, so shared-infra updates can use `--no-deps` without manual Compose commands.

## v1.1.6 Credentials Release Rollout

The follow-up credentials release was deployed later on 2026-05-18.

- Commit `34045ef7` passed `Build`, `Code Quality Analysis` and `Build demo image`; Docker run `26040847349` published the release after the container smoke gate passed.
- The earlier commit `453f1c9f` did not reach the server because its `Build demo image` run `26039031680` failed during Compose smoke; that is why Telegram credentials were not visible after the first attempted update.
- The Contabo shared-infra host was pinned to `ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:v1.1.6` and `NEXT_PUBLIC_VERSION=v1.1.6`.
- `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY` was added to `.env.demo.shared-infra`; the value was generated on the server and was not printed.
- The normal tag pull stalled during GHCR layer finalization, so the server pulled the linux/amd64 manifest digest directly and retagged it locally as `v1.1.6`.
- Pulled image id: `sha256:b1d3d73b0f2d68c919adb61d53196ad538bcfc9494913fd0cd737edbf01ffd31`.
- Image build-time environment showed `NEXT_PUBLIC_VERSION=v1.1.6`.
- `acadepost-migrate` completed with exit code `0`.
- `acadepost-backend`, `acadepost-frontend` and the public nginx proxy reached healthy state on `v1.1.6`.
- Public readiness returned `{"status":"ok","service":"backend"}` from `https://post.fgln.pro/api/monitor/ready`.

Observed deployment caveats:

- In shared-infra mode, the nginx service port `5000` is internal. Host-level `curl http://127.0.0.1:5000/...` is not a valid readiness check unless the port is published. Use the public URL or `docker exec acadepost`.
- The orchestrator can remain in `starting` while it compiles Temporal workflow bundles for each task queue. Check logs before treating that state as a crash.
