FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM deps AS build
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV API_PROXY_TARGET=http://host.docker.internal:8080
EXPOSE 80
