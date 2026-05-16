# Mise a jour Docker demo AcadePost

AcadePost doit etre mis a jour sur serveur en tirant l'image GHCR deja construite par GitHub Actions. Le serveur ne doit pas faire de `docker build` pour une mise a jour demo normale.

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
- avertit si `ACADEPOST_IMAGE` utilise le tag mutable `:demo`;
- lance `docker compose pull acadepost`;
- recree le conteneur `acadepost` avec `--no-build --force-recreate`;
- attend `/api/monitor/ready`;
- affiche l'image actuellement utilisee et le digest precedent si disponible.

## Ce qui reste dans `.env`

Le domaine, le port, la base de donnees, les secrets, SMTP et OAuth restent en runtime config dans `.env`. Ils ne sont pas graves dans l'image Docker.

Variables importantes :

- `ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:demo`
- `ACADEPOST_PUBLIC_URL=https://YOUR_DOMAIN`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`
- `TRUST_PROXY=true` derriere Caddy, Traefik ou Nginx.
- `PUBLIC_API_ALLOW_OAUTH=false` par defaut; garder `false` sauf si le flux OAuth public est audite et voulu.

## Rollback

Pour un rollback fiable, utiliser un tag SHA ou un digest publie par GitHub Actions :

```env
ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:<sha>
```

Puis relancer :

```bash
bash deploy/demo/update.sh --env .env.demo.shared-infra --compose docker-compose.demo.shared-infra.yaml
```

Ne pas utiliser `down -v` pour une mise a jour: cela supprime les volumes et peut effacer les donnees demo.
