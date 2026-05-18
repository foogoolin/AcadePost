# How To Brief Codex For Docker Work

This guide exists because the Docker goal for AcadéPost was easy to misunderstand. Future Codex/BYAN sessions must treat Docker deploy work as a release/update system, not as a local build exercise.

## The Target State

When the owner asks for Docker deploy or Docker update work, the expected target is:

- GitHub Actions builds the production image.
- GitHub Container Registry publishes `ghcr.io/foogoolin/acadepost:latest`.
- GHCR also keeps version, SHA, or digest references for rollback.
- The VPS pulls the already-built image.
- The VPS must not run `docker build` for normal installs or updates.
- Server runtime config stays in `.env`: domain, port, database URL, OAuth callback host, SMTP and secrets.
- The image stays domain-agnostic and secret-free.

In plain terms: build in CI, pull on server.

## Best Owner Prompt

Use this shape when asking Codex for Docker work:

```text
I need AcadéPost to be self-hostable through a prebuilt GHCR Docker image.

Required result:
- GitHub Actions builds and publishes ghcr.io/foogoolin/acadepost:latest.
- The server update path is pull + up only, no docker build on the VPS.
- docker-compose files must not contain build: for the normal install path.
- deploy/demo/update.sh must validate compose, pull the image, run up --no-build, wait for /api/monitor/ready, and print rollback info.
- Secrets, domain, OAuth callbacks, DB and ports must stay in .env or reverse-proxy config, not inside the image.
- Add CI gates for image size, compose config, Docker context hygiene and container smoke before publishing latest.
- Do not touch the server until the image workflow is green and server audit is read-only.

Acceptance criteria:
- ghcr.io/foogoolin/acadepost:latest is published.
- CI shows image size and smoke test result.
- Server update docs say pull + up, not build.
- README explains the install image for third-party users.
- CHANGELOG records the version and Docker change.
```

## Words That Need Clarification

If the owner says "update Docker", Codex must not assume local build. Interpret it as:

- pull latest prebuilt image from GHCR;
- recreate containers with `--no-build`;
- health-check `/api/monitor/ready`.

If the owner says "install image", Codex must distinguish:

- image build: GitHub Actions responsibility;
- image pull: server responsibility;
- container startup: Docker Compose responsibility.

If the owner says "server is slow", Codex must first identify which step is slow:

- CI build/publish;
- registry pull;
- container startup;
- database migration;
- health check;
- reverse proxy or DNS.

## Red Flags

Stop and challenge the plan if Codex proposes any of these for normal deployment:

- run `docker build` on Contabo;
- copy the full monorepo into the runtime image;
- keep devDependencies, build cache, reports, BYAN output, local MCP config or real `.env` files in the image;
- publish `latest` before a compose smoke test;
- run `docker compose down -v` during an update;
- touch the server before the GHCR image is green;
- mix domain, OAuth callback host or secrets into the Docker image.

## Required Checks Before Claiming Done

Before saying Docker work is ready, Codex must show evidence for:

- `docker compose config --quiet`;
- no `build:` in normal install compose services;
- Docker context does not include `.env`, `.mcp`, `_byan-output`, reports or secrets;
- image size is reported and below the configured hard limit;
- container smoke reaches `/api/monitor/ready`;
- update script uses pull + `up --no-build`;
- README, CHANGELOG and deploy docs are updated;
- no server command was run unless the owner explicitly asked in that turn.

## Server Update Rule

The safe server sequence is:

1. read-only audit first;
2. backup `.env` and compose files;
3. update server checkout or deploy files;
4. confirm `ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:latest`;
5. run `deploy/demo/update.sh`;
6. verify `/api/monitor/ready`;
7. inspect logs if health fails;
8. rollback by pinning the previous SHA or digest.

Never improvise destructive cleanup during the update. Disk cleanup is a separate runbook.
