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

## Production

Image nginx multi-étapes. Le conteneur écoute le port 80, publié ici en 8081.

```bash
docker compose -f docker-compose.prod.yml up --build
```

Application : http://localhost:8081
