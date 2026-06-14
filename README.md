# WholesaleOS — Cloud ERP + CRM + WMS

A production-ready, full-stack, cloud-based **ERP + CRM + WMS** web application for a wholesale clothing company. Built for a university **Networking in the Cloud** assignment to demonstrate cloud networking, scalability, security, deployment readiness, containerization, and CI/CD practices.

## Architecture (Three-Tier)

```
         ┌─────────────────────────────────────────┐
         │  Tier 1: Presentation (React 19 + MUI)    │
         │  Served by Nginx, talks to API over HTTPS │
         └───────────────────┬─────────────────────-┘
                             │  REST / JSON
         ┌───────────────────▼─────────────────────-┐
         │  Tier 2: Application (Node.js + Express)  │
         │  JWT auth, RBAC, validation, logging      │
         └───────────────────┬─────────────────────-┘
                             │  Prisma ORM (parameterized)
         ┌───────────────────▼─────────────────────-┐
         │  Tier 3: Data (PostgreSQL / AWS RDS)      │
         └───────────────────────────────────────────┘
```

### AWS Target Topology (future deployment)

```
Internet → Route 53 → Application Load Balancer (ALB)
        → Auto Scaling Group (ASG) of EC2 instances (Docker containers)
        → Amazon RDS for PostgreSQL (Multi-AZ)
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full AWS networking design (VPC, subnets, security groups).

## Tech Stack

| Layer            | Technology                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Frontend         | React 19, TypeScript, Vite, React Router, TanStack Query, Axios, MUI  |
| Backend          | Node.js, Express.js, TypeScript, Prisma ORM, JWT, RBAC                 |
| Database         | PostgreSQL                                                            |
| Containerization | Docker, Docker Compose                                                |
| CI/CD            | GitHub Actions                                                        |

## Modules

- **Authentication** — Register, Login, Logout, Refresh Token, bcrypt hashing, protected routes, RBAC (Admin / Manager / Warehouse Staff).
- **Dashboard** — Total products, customers, orders, revenue, low-stock alerts, recent orders.
- **ERP (Products)** — CRUD, search, pagination, filtering.
- **CRM (Customers)** — CRUD, search, customer order history.
- **WMS (Warehouse)** — Stock In / Stock Out, inventory tracking, inventory history, low-stock monitoring.
- **Orders** — CRUD, status workflow (Pending → Processing → Shipped → Delivered), tracking, customer association.

## Quick Start (Docker — recommended)

```bash
cp .env.example .env
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Health check: http://localhost:4000/health

Default seeded login:

| Role            | Email                   | Password    |
| --------------- | ----------------------- | ----------- |
| Admin           | admin@wholesaleos.com   | Admin@123   |
| Manager         | manager@wholesaleos.com | Manager@123 |
| Warehouse Staff | staff@wholesaleos.com   | Staff@123   |

## Local Development (without Docker)

See [`docs/WINDOWS_SETUP.md`](docs/WINDOWS_SETUP.md) for the complete Windows guide, and the per-app READMEs in `backend/` and `frontend/`.

## Documentation

- [API Reference](docs/API.md)
- [Deployment Guide (AWS)](docs/DEPLOYMENT.md)
- [Windows Setup Guide](docs/WINDOWS_SETUP.md)

## Repository Structure

```
erp-crm-wms/
├── backend/            # Express + Prisma REST API
├── frontend/           # React 19 + MUI SPA
├── docs/               # API, deployment, Windows setup
├── .github/workflows/  # GitHub Actions CI/CD
├── docker-compose.yml
├── .env.example
└── README.md
```

## License

MIT — for educational use.
