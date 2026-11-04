# Builds the React app and serves it with Caddy (automatic HTTPS, SPA fallback, /api reverse proxy).
# Build context: ./frontend   (docker-compose.prod.yml sets dockerfile: ../deploy/web.Dockerfile)
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# The browser calls the API on the SAME origin (/api), which Caddy forwards to the API container.
ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
RUN npm run build

FROM caddy:2-alpine AS runtime
COPY --from=build /app/dist /srv
# /etc/caddy/Caddyfile is mounted by docker-compose.prod.yml (deploy/Caddyfile), so it can be edited without a rebuild.
