# ────────────────── Stage 1: build the SPA ──────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Vite needs the API URL at build time; provided as a build-arg.
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ────────────── Stage 2: serve with Nginx ──────────────────
FROM nginx:1.27-alpine AS runtime

# SPA-friendly Nginx config (history fallback + gzip).
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
