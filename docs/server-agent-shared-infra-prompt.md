# Prompt pour agent serveur: deploiement shared-infra AcadePost

```text
You are the server deployment agent for AcadePost. Deploy the current `main` branch on the existing shared-infra server.

Target for this deployment:
- Public domain: https://post.fgln.pro
- Install directory: /opt/AcadePost
- Reverse proxy: existing Caddy
- Caddy Docker network: proxy
- Shared PostgreSQL Docker network: backend
- Existing PostgreSQL host from Docker network: postgres

Important architecture:
- Do NOT use the clean-VPS compose for this server.
- Use `docker-compose.demo.shared-infra.yaml`.
- Use `.env.demo.shared-infra`, created from `.env.demo.shared-infra.example`.
- Do NOT open public port 4007.
- Do NOT add a UFW rule for 4007.
- Caddy must reverse proxy to `acadepost:5000` over the Docker `proxy` network.
- The Docker image must stay domain-portable. The domain belongs in runtime env only:
  `ACADEPOST_PUBLIC_URL=https://post.fgln.pro`.
- `NEXT_PUBLIC_BACKEND_URL` should stay `/api`, not a hardcoded domain.

Preflight:
1. Check server resources:
   - `free -h`
   - `df -h`
   - `docker ps`
   - `docker network ls`
2. Confirm Docker networks exist:
   - `proxy`
   - `backend`
3. Confirm DNS points to this server:
   - `post.fgln.pro -> 37.60.228.98`

Prepare PostgreSQL:
1. In the shared PostgreSQL instance, create app DB/user if missing:
   ```sql
   CREATE USER acadepost WITH PASSWORD 'GENERATE_STRONG_PASSWORD';
   CREATE DATABASE acadepost OWNER acadepost;
   GRANT ALL PRIVILEGES ON DATABASE acadepost TO acadepost;
   ```
2. Create Temporal DB/user if missing:
   ```sql
   CREATE USER temporal WITH PASSWORD 'GENERATE_STRONG_PASSWORD';
   CREATE DATABASE temporal OWNER temporal;
   CREATE DATABASE temporal_visibility OWNER temporal;
   GRANT ALL PRIVILEGES ON DATABASE temporal TO temporal;
   GRANT ALL PRIVILEGES ON DATABASE temporal_visibility TO temporal;
   ```

Prepare repository:
1. If `/opt/AcadePost` does not exist:
   - `git clone https://github.com/foogoolin/AcadePost.git /opt/AcadePost`
2. If it exists:
   - inspect `git status`
   - `git fetch origin main`
   - update safely to latest `main`

Prepare env:
1. `cd /opt/AcadePost`
2. `cp .env.demo.shared-infra.example .env.demo.shared-infra` if missing.
3. Set:
   - `ACADEPOST_PUBLIC_URL=https://post.fgln.pro`
   - `NEXT_PUBLIC_BACKEND_URL=/api`
   - `DATABASE_URL=postgresql://acadepost:APP_PASSWORD@postgres:5432/acadepost`
   - `TEMPORAL_POSTGRES_HOST=postgres`
   - `TEMPORAL_POSTGRES_USER=temporal`
   - `TEMPORAL_POSTGRES_PASSWORD=TEMPORAL_PASSWORD`
   - `TEMPORAL_DB=temporal`
   - `TEMPORAL_VISIBILITY_DB=temporal_visibility`
   - `JWT_SECRET=GENERATE_LONG_RANDOM_SECRET`
   - `TRUST_PROXY=true`
   - `ACADEPOST_DEMO_DB_PUSH=false` by default

First demo schema bootstrap:
- If the app DB is empty, temporarily set `ACADEPOST_DEMO_DB_PUSH=true` for the first controlled startup only.
- After schema is created, set it back to `false`.
- Never leave `ACADEPOST_DEMO_DB_PUSH=true` permanently on shared PostgreSQL.

Start:
```bash
cd /opt/AcadePost
bash deploy/demo/server-up-shared-infra.sh
```

Caddy:
If Caddy is attached to Docker network `proxy`, use:
```caddyfile
post.fgln.pro {
  reverse_proxy acadepost:5000
}
```

Health checks:
```bash
curl -f https://post.fgln.pro/api/monitor/health
curl -f https://post.fgln.pro/api/monitor/ready
docker compose --env-file .env.demo.shared-infra -f docker-compose.demo.shared-infra.yaml ps
docker compose --env-file .env.demo.shared-infra -f docker-compose.demo.shared-infra.yaml logs --tail=200 acadepost
```

Expected:
- No public port 4007 exposure.
- App reachable only through Caddy HTTPS.
- PostgreSQL is external/shared.
- Redis is local to the AcadePost stack.
- Temporal is local to the AcadePost stack but uses external/shared PostgreSQL.
- Upload/config/Redis/Temporal ES data are bind-mounted under `ACADEPOST_DATA_DIR`.

Final report:
- Public URL
- Running containers
- Healthcheck result
- Whether schema bootstrap was used
- Any blockers
- Do not print secrets.
```
