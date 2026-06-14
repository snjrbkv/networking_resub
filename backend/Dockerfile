# ────────────────── Stage 1: build ──────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

RUN npm prune --omit=dev

# ───────────────── Stage 2: runtime ────────────────
FROM node:20-alpine AS runtime

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/src/server.js"]