# ─── Stage 1 : Build Vite ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .

# L'URL de l'API backend est injectée au build
ARG VITE_API_URL=http://localhost:8090
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ─── Stage 2 : Nginx pour servir le build ────────────────────────────────────
FROM nginx:alpine

# Copier le build Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Config Nginx pour SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
