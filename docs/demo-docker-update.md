# Mise à jour Docker demo AcadéPost

AcadéPost doit être mis à jour sur serveur en tirant l'image GHCR déjà construite par GitHub Actions. Le serveur ne doit pas faire de `docker build` pour une mise à jour demo normale.

## Clean VPS

```bash
cd /opt/AcadePost
bash deploy/demo/update.sh --env .env.demo --compose docker-compose.demo.yaml
```

## Shared infra

```bash
cd /opt/AcadePost
bash deploy/demo/update.sh --env .env.demo.shared-infra --compose docker-compose.demo.shared-infra.yaml
```

Le script fait volontairement seulement ceci :

- valide le fichier Compose;
- lance `docker compose pull acadepost`;
- recrée le conteneur `acadepost` avec `--no-build --force-recreate`;
- attend `/api/monitor/ready`;
- affiche l'image actuellement utilisée.

## Ce qui reste dans `.env`

Le domaine, le port, la base de données, les secrets, SMTP et OAuth restent en runtime config dans `.env`. Ils ne sont pas gravés dans l'image Docker.

Variables importantes :

- `ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:demo`
- `ACADEPOST_PUBLIC_URL=https://YOUR_DOMAIN`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`
- `TRUST_PROXY=true` derrière Caddy, Traefik ou Nginx.

## Rollback

Pour un rollback fiable, utiliser un tag SHA publié par GitHub Actions :

```env
ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:<sha>
```

Puis relancer :

```bash
bash deploy/demo/update.sh --env .env.demo.shared-infra --compose docker-compose.demo.shared-infra.yaml
```

Ne pas utiliser `down -v` pour une mise à jour: cela supprime les volumes et peut effacer les données demo.
