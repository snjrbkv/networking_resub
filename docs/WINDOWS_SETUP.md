# Windows Setup Guide (Step by Step)

This guide takes you from a clean Windows machine to a fully running **WholesaleOS** ERP + CRM + WMS application. There are **two ways** to run it:

- **Option A — Docker (recommended, one command).**
- **Option B — Manual (run frontend + backend + PostgreSQL yourself).**

---

## 1. Install Node.js

1. Go to <https://nodejs.org> and download the **LTS** installer (20.x or newer).
2. Run the installer, accept defaults, and keep “Add to PATH” checked.
3. Verify in **PowerShell**:
   ```powershell
   node -v
   npm -v
   ```

## 2. Install Git

1. Download from <https://git-scm.com/download/win> and install (defaults are fine).
2. Verify:
   ```powershell
   git --version
   ```

## 3. Install Docker Desktop

1. Download from <https://www.docker.com/products/docker-desktop/>.
2. Run the installer. When prompted, enable the **WSL 2** backend (recommended).
3. Reboot if asked, then launch **Docker Desktop** and wait until it says *Running*.
4. Verify:
   ```powershell
   docker --version
   docker compose version
   ```

---

# Option A — Run everything with Docker (easiest)

This builds the frontend, backend, and PostgreSQL, runs migrations, and seeds demo data automatically.

1. Unzip the project and open the folder in PowerShell:
   ```powershell
   cd path\to\erp-crm-wms
   ```
2. Create the backend env file (Docker Compose already provides values, but the file keeps Prisma happy):
   ```powershell
   Copy-Item backend\.env.example backend\.env
   Copy-Item frontend\.env.example frontend\.env
   ```
3. Build and start everything:
   ```powershell
   docker compose up --build
   ```
4. Open the app:
   - Frontend: <http://localhost:3000>
   - API health: <http://localhost:4000/health>
5. Log in with a seeded account:
   - `admin@wholesaleos.com` / `Admin@123`
   - `manager@wholesaleos.com` / `Manager@123`
   - `staff@wholesaleos.com` / `Staff@123`
6. To stop: press `Ctrl + C`, then optionally:
   ```powershell
   docker compose down            # stop & remove containers
   docker compose down -v         # also delete the database volume
   ```

> If port 3000, 4000, or 5432 is already in use, edit the `ports` in `docker-compose.yml`.

---

# Option B — Manual setup (no Docker for the app)

Use this if you want to run the frontend and backend directly with Node.

## B1. Create a PostgreSQL database

**Easiest:** run only the database in Docker:
```powershell
docker run --name wholesale-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=wholesaleos -p 5432:5432 -d postgres:16-alpine
```

**Or** install PostgreSQL natively:
1. Download from <https://www.postgresql.org/download/windows/> and install (remember the `postgres` password).
2. Open **pgAdmin** or **SQL Shell (psql)** and create the database:
   ```sql
   CREATE DATABASE wholesaleos;
   ```

## B2. Configure and run the backend

```powershell
cd backend
Copy-Item .env.example .env
```
Edit `backend\.env` so `DATABASE_URL` matches your database, e.g.:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wholesaleos?schema=public"
```
Then install, migrate, seed, and start:
```powershell
npm install
npx prisma generate
npx prisma migrate deploy   # apply the included migration
npm run seed                # load demo users + data
npm run dev                 # API on http://localhost:4000
```

## B3. Configure and run the frontend (new terminal)

```powershell
cd frontend
Copy-Item .env.example .env   # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                   # app on http://localhost:3000
```

Open <http://localhost:3000> and log in with the seeded accounts above.

---

## 4. Testing the APIs

### With curl (PowerShell)
```powershell
# Health
curl http://localhost:4000/health

# Login (copy the accessToken from the response)
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{ \"email\": \"admin@wholesaleos.com\", \"password\": \"Admin@123\" }'

# Use the token
curl http://localhost:4000/api/dashboard -H "Authorization: Bearer <accessToken>"
```

### With the backend tests
```powershell
cd backend
npm test
```

See `docs/API.md` for the full endpoint list. You can also import the endpoints into Postman.

---

## 5. Push to a GitHub repository

1. Create a new **empty** repository on GitHub (no README).
2. In the project root:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit: WholesaleOS ERP + CRM + WMS"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

## 6. CI/CD setup (GitHub Actions)

- The workflow at `.github/workflows/deploy.yml` runs automatically on every push/PR to `main`.
- After pushing, open the **Actions** tab on GitHub to watch the **backend**, **frontend**, and **docker** jobs run (install dependencies, run tests, build, build Docker images).
- No secrets are required for the default build. To extend it to deploy to AWS, add repository secrets (e.g. `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `ECR_REPOSITORY`) and uncomment the deploy section in the workflow. See `docs/DEPLOYMENT.md`.

---

## 7. Troubleshooting

| Problem | Fix |
| --- | --- |
| `prisma migrate` cannot connect | Confirm PostgreSQL is running and `DATABASE_URL` is correct. |
| Port already in use | Change the port in `docker-compose.yml` or stop the conflicting app. |
| Frontend cannot reach API | Ensure `VITE_API_URL` points to `http://localhost:4000/api` and the backend is running. |
| `docker compose up` fails to build | Make sure Docker Desktop is running; retry `docker compose build --no-cache`. |
| Login fails | Run `npm run seed` (manual) or recreate containers so seeding runs. |
