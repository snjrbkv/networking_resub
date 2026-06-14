# Deployment Guide — Cloud & AWS

This document explains how **WholesaleOS** maps onto a scalable, secure AWS cloud network for the *Networking in the Cloud* assignment. It covers the local Docker workflow, the CI/CD pipeline, and the target AWS reference architecture.

## 1. Three-tier architecture

```
            Internet
               |
      [ Application Load Balancer ]      (public subnets, HTTPS :443)
               |
   ----------------------------------
   |                                |
[ Frontend ASG ]              [ Backend ASG ]    (private app subnets)
  Nginx + React                Node/Express API
                                     |
                          [ Amazon RDS PostgreSQL ]  (private data subnets, Multi-AZ)
```

- **Tier 1 – Presentation:** React SPA served by Nginx (container/EC2), fronted by the ALB.
- **Tier 2 – Application:** Express REST API in an Auto Scaling Group across multiple Availability Zones.
- **Tier 3 – Data:** Amazon RDS for PostgreSQL in private subnets, reachable only from the app tier.

## 2. VPC network design (reference)

| Component | CIDR / Setting | Notes |
| --- | --- | --- |
| VPC | `10.0.0.0/16` | Single region, 2+ AZs |
| Public subnets | `10.0.0.0/24`, `10.0.1.0/24` | ALB + NAT Gateway |
| Private app subnets | `10.0.10.0/24`, `10.0.11.0/24` | EC2 Auto Scaling instances |
| Private data subnets | `10.0.20.0/24`, `10.0.21.0/24` | RDS subnet group |
| Internet Gateway | attached to VPC | Public egress/ingress |
| NAT Gateway | one per AZ | Private subnet outbound updates |

### Security groups (least privilege)

| SG | Inbound | Source |
| --- | --- | --- |
| `alb-sg` | 80, 443 | `0.0.0.0/0` |
| `app-sg` | 4000 (API), 80 (web) | `alb-sg` only |
| `rds-sg` | 5432 | `app-sg` only |

This chaining (Internet -> ALB -> App -> RDS) demonstrates network segmentation and the principle of least privilege.

## 3. Scalability

- **Auto Scaling Group** with a target-tracking policy (e.g. keep average CPU < 60%).
- **ALB health checks** hit `GET /health` (backend) and `/` (frontend). Unhealthy instances are replaced automatically.
- **Stateless API:** JWT auth means any instance can serve any request — no sticky sessions required.
- **RDS Multi-AZ** for database failover; optional read replicas for scaling reads.

## 4. Security checklist (implemented in code)

- JWT access + refresh tokens, refresh-token rotation, bcrypt password hashing.
- Role-Based Access Control middleware (`Admin`, `Manager`, `Warehouse Staff`).
- `helmet` security headers, configurable `CORS` allow-list.
- `express-rate-limit` on `/api`.
- Zod input validation on every write endpoint.
- Prisma parameterised queries (SQL injection protection).
- `trust proxy` enabled so rate-limiting and client IPs work behind the ALB.
- Secrets supplied via environment variables (use AWS Secrets Manager / SSM Parameter Store in production).

## 5. Local containerized run

```bash
docker-compose up --build
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api |
| PostgreSQL | localhost:5432 |

The backend container runs `prisma migrate deploy`, seeds the database, then starts the API.

## 6. CI/CD pipeline (GitHub Actions)

`.github/workflows/deploy.yml` runs on every push / PR to `main`:

1. **backend** job — install deps, generate Prisma client, type-check, run Jest tests, build.
2. **frontend** job — install deps, type-check, build the production bundle.
3. **docker** job — build backend & frontend images to validate the Dockerfiles.

Extending to AWS (commented example in the workflow): push images to **Amazon ECR**, then trigger a rolling update of the Auto Scaling Group / ECS service or run `aws deploy` for CodeDeploy.

## 7. Production environment variables

Set these on each app instance (or via SSM):

```
DATABASE_URL=postgresql://USER:PASSWORD@<rds-endpoint>:5432/wholesaleos
JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<another-strong-secret>
CORS_ORIGIN=https://your-frontend-domain
NODE_ENV=production
```

Frontend build-time variable:

```
VITE_API_URL=https://your-api-domain/api
```

## 8. Suggested deploy steps to AWS (manual)

1. Create the VPC, subnets, IGW, NAT, route tables, and security groups above.
2. Launch an RDS PostgreSQL instance in the data subnets; note the endpoint.
3. Build & push images to ECR.
4. Create a Launch Template (user-data pulls images and runs the containers).
5. Create an Auto Scaling Group across the private app subnets.
6. Create the Application Load Balancer + target groups (`/health`, `/`).
7. Point Route 53 / your DNS at the ALB and attach an ACM TLS certificate.
8. Run `prisma migrate deploy` once against RDS (via a bastion or a one-off task).
