# Deploiement demo AcadéPost

Ce document decrit un deploiement brut pour demo client. Ce n'est pas une procedure production.

## Objectif

- Lancer AcadéPost sur un seul serveur Linux.
- Exposer uniquement l'application sur le port `4007`.
- Garder PostgreSQL, Redis et Temporal dans Docker Compose.
- Utiliser le stockage local `/uploads` pour une demo rapide.
- Accepter `prisma db push --accept-data-loss` uniquement en mode demo via `ACADEPOST_DEMO_DB_PUSH=true`.

## Prerequis serveur

- Ubuntu 22.04 ou 24.04.
- Docker Engine avec le plugin Docker Compose.
- 4 CPU / 8 Go RAM minimum pour une demo courte; 16 Go RAM est plus confortable pendant le build Docker.
- 50 Go disque minimum.
- Un domaine ou une IP publique.

## Installation Docker sur Ubuntu

Si Docker n'est pas encore installe sur le serveur :

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

Reconnecter la session SSH apres ajout eventuel de l'utilisateur au groupe `docker`.

## Installation rapide

```bash
git clone <repo-url> AcadePost
cd AcadePost
cp .env.demo.example .env.demo
nano .env.demo
```

Variables obligatoires a modifier dans `.env.demo` :

```env
ACADEPOST_PUBLIC_URL=http://SERVER_IP:4007
POSTGRES_PASSWORD=change-this
TEMPORAL_POSTGRES_PASSWORD=change-this
JWT_SECRET=change-this-long-random-string
```

Si un domaine HTTPS est deja configure par reverse proxy, utiliser :

```env
ACADEPOST_PUBLIC_URL=https://demo.example.com
```

## Lancement

```bash
docker compose --env-file .env.demo -f docker-compose.demo.yaml up -d --build
```

L'application sera disponible sur :

```text
http://SERVER_IP:4007
```

## Lancement assiste sur Contabo

Depuis le dossier du depot sur le serveur :

```bash
ACADEPOST_PUBLIC_URL=http://SERVER_IP:4007 bash deploy/demo/server-up.sh
```

Le script cree `.env.demo` si absent, remplace les secrets demo par des valeurs aleatoires, valide le compose, construit l'image et lance la stack.

## Logs

```bash
docker compose --env-file .env.demo -f docker-compose.demo.yaml ps
docker compose --env-file .env.demo -f docker-compose.demo.yaml logs -f acadepost
```

## Health checks

```bash
curl -f http://SERVER_IP:4007/
curl -f http://SERVER_IP:4007/api/monitor/queue/server
docker compose --env-file .env.demo -f docker-compose.demo.yaml exec acadepost-postgres pg_isready -U acadepost-user -d acadepost-db-local
docker compose --env-file .env.demo -f docker-compose.demo.yaml exec acadepost-redis redis-cli ping
```

## Smoke demo

1. Ouvrir la page d'authentification.
2. Creer un compte proprietaire.
3. Creer deux projets : `Démo Alpha` et `Démo Bêta`.
4. Inviter un membre `Admin`.
5. Inviter un membre `Éditeur`.
6. Verifier que le switch de projet change les posts, medias et integrations visibles.
7. Verifier qu'un `Éditeur` ne peut pas acceder aux actions admin.
8. Uploader une image et verifier que `/uploads/...` la sert correctement.

## Mise a jour du code

```bash
git pull
docker compose --env-file .env.demo -f docker-compose.demo.yaml up -d --build
```

Pour preserver les donnees de demo, ne jamais lancer :

```bash
docker compose -f docker-compose.demo.yaml down -v
```

## Rollback simple

Avant une mise a jour :

```bash
mkdir -p backups
docker compose --env-file .env.demo -f docker-compose.demo.yaml exec -T acadepost-postgres pg_dump -U acadepost-user acadepost-db-local > backups/acadepost-predeploy.sql
git rev-parse --short HEAD > backups/git-revision.txt
```

Rollback :

```bash
git checkout <previous-commit>
docker compose --env-file .env.demo -f docker-compose.demo.yaml up -d --build
```

## Limites connues

- Ce compose est fait pour demo/staging, pas production.
- Les migrations sont appliquees par `prisma db push` si `ACADEPOST_DEMO_DB_PUSH=true`.
- Le stockage media est local au serveur.
- Les integrations sociales restent inactives tant que les cles API sont vides.
- Pour HTTPS, placer Caddy, Traefik, Nginx Proxy Manager ou Cloudflare Tunnel devant le port `4007`.
