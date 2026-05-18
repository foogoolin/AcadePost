# Mise a jour Docker AcadePost

AcadePost doit etre mis a jour sur serveur en tirant l'image GHCR deja construite par GitHub Actions. Le serveur ne doit pas faire de `docker build` pour une mise a jour normale.

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
- avertit si `ACADEPOST_IMAGE` utilise un tag mutable comme `:latest` ou `:demo`;
- lance `docker compose pull` pour `acadepost-migrate`, `acadepost-backend`, `acadepost-frontend`, `acadepost-orchestrator` et le proxy `acadepost`;
- recree les services avec `--no-build --force-recreate`;
- attend `/api/monitor/ready`;
- affiche l'image actuellement utilisee et le digest precedent si disponible.

Le service public `acadepost` est maintenant un proxy nginx leger. Les processus applicatifs tournent dans des conteneurs internes separes:

- `acadepost-backend` sur `3000`;
- `acadepost-frontend` sur `4200`;
- `acadepost-orchestrator` sur `3002`;
- `acadepost-migrate` comme tache one-shot pour le bootstrap Prisma demo.

## Validation CI vs mise a jour serveur

GitHub Actions peut prendre plusieurs minutes avant de publier `:latest`, parce que le workflow construit l'image, controle la taille, demarre la stack Compose et attend `/api/monitor/ready`.

La mise a jour serveur ne doit pas refaire cette construction. Sur le serveur, le script doit seulement tirer l'image deja publiee puis recreer les conteneurs:

```bash
docker compose pull
docker compose up -d --no-build --force-recreate
```

Si `docker compose pull` est lent, le serveur est en train de telecharger des layers depuis GHCR. Ce n'est pas un build local. Ne pas lancer `docker build` sur le VPS pour corriger cela.

Pour verifier l'image actuellement publiee:

```bash
docker buildx imagetools inspect ghcr.io/foogoolin/acadepost:latest
```

Edge cases:

- si le health check echoue, lire les logs du service en erreur avant toute autre action;
- ne pas utiliser `down -v` pour une mise a jour, car cela peut supprimer les volumes;
- pour un rollback fiable, remplacer `:latest` par un tag SHA ou un digest connu, puis relancer le script.

## Ce qui reste dans `.env`

Le domaine, le port, la base de donnees, les secrets, SMTP et OAuth restent en runtime config dans `.env`. Ils ne sont pas graves dans l'image Docker.

Variables importantes :

- `ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:latest`
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
