# Deploiement demo shared-infra AcadePost

Ce runbook est pour un serveur qui possede deja :

- Caddy comme reverse proxy HTTPS.
- Un PostgreSQL partage dans le reseau Docker `backend`.
- Un reseau Docker `proxy` pour les applications exposees par Caddy.

Le compose shared-infra ne publie pas de port public. Caddy doit parler au conteneur `acadepost` via le reseau Docker `proxy`.

## Fichiers

- `.env.demo.shared-infra.example`
- `docker-compose.demo.shared-infra.yaml`
- `deploy/demo/server-up-shared-infra.sh`

## Image preconstruite

Le serveur ne construit pas l'application. Il tire l'image publiee par GitHub Actions :

```text
ghcr.io/foogoolin/acadepost:latest
```

Le tag `:demo` existe aussi comme tag mobile pour le dernier build MVP de `main`. Un tag versionne ou SHA peut etre utilise pour rollback.

Si le pull echoue avec une erreur d'authentification, rendre le package GHCR public dans GitHub Packages ou faire un `docker login ghcr.io` avec un token autorise.

## Image portable

Le domaine n'est pas grave dans l'image Docker. Pendant le build, le bundle frontend utilise une route relative `/api`, donc le meme build peut fonctionner derriere n'importe quel domaine.

Le domaine est une configuration runtime :

```env
ACADEPOST_PUBLIC_URL=https://YOUR_DOMAIN
MAIN_URL=https://YOUR_DOMAIN
FRONTEND_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_BACKEND_URL=https://YOUR_DOMAIN/api
```

Dans compose, `MAIN_URL` et `FRONTEND_URL` sont derives de `ACADEPOST_PUBLIC_URL`. En runtime, `NEXT_PUBLIC_BACKEND_URL` doit etre absolu, par exemple `https://YOUR_DOMAIN/api`, car le backend l'utilise aussi pour generer des URLs MCP/OAuth. Le launcher le recalcule automatiquement depuis `ACADEPOST_PUBLIC_URL` si la valeur exemple n'a pas ete remplacee.

## Preparation PostgreSQL externe

Creer la base applicative dans le PostgreSQL partage :

```sql
CREATE USER acadepost WITH PASSWORD 'CHANGE_ME_APP_DB_PASSWORD';
CREATE DATABASE acadepost OWNER acadepost;
GRANT ALL PRIVILEGES ON DATABASE acadepost TO acadepost;
```

Creer les bases Temporal si Temporal utilise le meme PostgreSQL partage :

```sql
CREATE USER temporal WITH PASSWORD 'CHANGE_ME_TEMPORAL_DB_PASSWORD';
CREATE DATABASE temporal OWNER temporal;
CREATE DATABASE temporal_visibility OWNER temporal;
GRANT ALL PRIVILEGES ON DATABASE temporal TO temporal;
GRANT ALL PRIVILEGES ON DATABASE temporal_visibility TO temporal;
```

## Lancement

```bash
cd /opt/AcadePost
cp .env.demo.shared-infra.example .env.demo.shared-infra
nano .env.demo.shared-infra
bash deploy/demo/server-up-shared-infra.sh
```

Le script verifie que les reseaux `proxy` et `backend` existent, cree les dossiers sous `ACADEPOST_DATA_DIR`, valide Compose, tire l'image GHCR et lance la stack.
Il ajuste aussi les droits du dossier `temporal-elasticsearch` pour l'utilisateur `1000` utilise par Elasticsearch.

## Variables critiques

- `ACADEPOST_PUBLIC_URL` : URL publique finale, par exemple `https://example.com`.
- `DATABASE_URL` : connexion PostgreSQL applicative externe.
- `TEMPORAL_POSTGRES_HOST` : host PostgreSQL vu depuis le reseau Docker `backend`.
- `TEMPORAL_POSTGRES_PASSWORD` : mot de passe de l'utilisateur Temporal.
- `JWT_SECRET` : secret long aleatoire pour les sessions.
- `TRUST_PROXY=true` : obligatoire derriere Caddy.
- `PUBLIC_API_ALLOW_OAUTH=false` : les tokens OAuth `pos_` ne sont pas acceptes par le Public API par defaut; utiliser une API key projet et les headers agent.
- `ACADEPOST_DEMO_DB_PUSH=false` : valeur par defaut en shared infra; changer a `true` uniquement pour un bootstrap demo controle.

## Bootstrap schema demo

Pour un premier demarrage demo sur une base vide, deux options :

1. Temporairement mettre `ACADEPOST_DEMO_DB_PUSH=true`, lancer la stack, verifier que le schema est cree, puis remettre `ACADEPOST_DEMO_DB_PUSH=false`.
2. Lancer la commande Prisma manuellement depuis le conteneur apres validation des credentials.

Ne pas laisser `ACADEPOST_DEMO_DB_PUSH=true` comme valeur permanente sur une base partagee.

## Caddy

Si Caddy est dans Docker et attache au reseau `proxy` :

```caddyfile
YOUR_DOMAIN {
  reverse_proxy acadepost:5000
}
```

Si Caddy tourne sur l'hote et pas dans Docker, utiliser le compose clean-VPS ou ajouter un override local qui bind `127.0.0.1:4007:5000`, puis :

```caddyfile
YOUR_DOMAIN {
  reverse_proxy 127.0.0.1:4007
}
```

Ne pas ouvrir le port `4007` en public.

## Health checks

Depuis Caddy/public :

```bash
curl -f https://YOUR_DOMAIN/api/monitor/health
curl -f https://YOUR_DOMAIN/api/monitor/ready
```

Depuis Docker :

```bash
docker compose --env-file .env.demo.shared-infra -f docker-compose.demo.shared-infra.yaml ps
docker compose --env-file .env.demo.shared-infra -f docker-compose.demo.shared-infra.yaml logs -f acadepost
```

`/api/monitor/ready` verifie en interne un TCP connect vers PostgreSQL, Redis et Temporal, mais retourne seulement un statut minimal pour ne pas exposer la topologie interne.

Le profil debug Temporal UI reste local par defaut avec `TEMPORAL_UI_BIND=127.0.0.1`.

## Mise a jour image demo

Pour mettre a jour AcadePost sans build sur le VPS :

```bash
bash deploy/demo/update.sh --env .env.demo.shared-infra --compose docker-compose.demo.shared-infra.yaml
```

Voir aussi `docs/demo-docker-update.md`. Le script tire `ACADEPOST_IMAGE` depuis `.env`, recree uniquement le service `acadepost` avec `--no-build`, puis attend `/api/monitor/ready`.

## Donnees et backups

Le compose shared-infra utilise des bind mounts sous :

```text
${ACADEPOST_DATA_DIR}/config
${ACADEPOST_DATA_DIR}/uploads
${ACADEPOST_DATA_DIR}/redis
${ACADEPOST_DATA_DIR}/temporal-elasticsearch
```

La base applicative et les bases Temporal sont dans le PostgreSQL partage. Les backups PostgreSQL doivent etre faits depuis l'infra Postgres partagee.
