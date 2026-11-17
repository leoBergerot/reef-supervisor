# Reef Supervisor

Interface pour suivre les paramètres d’eau de plusieurs aquariums. L’application parle à l’API FastAPI (`reef-supervisor-py`) via le préfixe `/api`, proxifié par Vite en développement et par nginx en production.

L’API est attendue sur le port 8080 de la machine hôte. Pour la joindre autrement :

```bash
export API_PROXY_TARGET=http://host.docker.internal:8080
```

## Développement

```bash
docker compose up --build
```

Application : http://localhost:5173

Sans Docker : `npm install` puis `npm run dev` (proxy vers `http://localhost:8080`, ou `API_PROXY_TARGET`).

Copiez `.env-dist` vers `.env` et renseignez `REACT_APP_TURNSTILE_SITE_KEY` (clé publique Turnstile). La clé de test Cloudflare `1x00000000000000000000AA` convient en local.

## Production

Image nginx multi-étapes. Le conteneur écoute le port 80, publié ici en 8081.

```bash
export REACT_APP_TURNSTILE_SITE_KEY=your_site_key
docker compose -f docker-compose.prod.yml up --build
```

Application : http://localhost:8081

Auth forms send `turnstileToken` to the API (login, register, forgot-password, recover-password). The API must verify it server-side.
