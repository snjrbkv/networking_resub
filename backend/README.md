# WholesaleOS Backend (API)

Express + TypeScript + Prisma REST API for the ERP + CRM + WMS platform.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start in watch mode (tsx) |
| `npm run build` | Generate Prisma client + compile TS to `dist/` |
| `npm start` | Run the compiled server (`dist/server.js`) |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:deploy` | Apply migrations in production |
| `npm run seed` | Seed default users + demo data |
| `npm test` | Run Jest tests |

## Local setup

```bash
cp .env.example .env          # then edit DATABASE_URL etc.
npm install
npx prisma generate
npx prisma migrate deploy     # or: npm run prisma:migrate
npm run seed
npm run dev
```

API base URL: `http://localhost:4000/api` — health check at `/health`.

See [`../docs/API.md`](../docs/API.md) for the full endpoint reference.
