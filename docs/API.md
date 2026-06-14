# WholesaleOS API Reference

Base URL: `http://localhost:4000/api`

All responses use a consistent envelope:

```json
{ "success": true, "data": { } }
```

List endpoints add a `pagination` object:

```json
{ "success": true, "data": [], "pagination": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 1 } }
```

Errors:

```json
{ "success": false, "message": "Human readable error" }
```

## Authentication

Send the access token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

| Method | Endpoint | Roles | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register a user. Body: `name, email, password, role?` |
| POST | `/auth/login` | Public | Login. Body: `email, password`. Returns `user, accessToken, refreshToken` |
| POST | `/auth/refresh` | Public | Exchange a refresh token. Body: `refreshToken` |
| POST | `/auth/logout` | Authenticated | Invalidate the stored refresh token |
| GET | `/auth/me` | Authenticated | Current user profile |

> Only an Admin may register a user with a role other than `WAREHOUSE_STAFF`.

## Dashboard

| Method | Endpoint | Roles | Description |
| --- | --- | --- | --- |
| GET | `/dashboard` | Authenticated | Totals, revenue, low-stock alerts, recent orders |

## Products (ERP)

| Method | Endpoint | Roles | Description |
| --- | --- | --- | --- |
| GET | `/products` | Authenticated | Query: `page, pageSize, search, category, lowStock, sortBy, sortDir` |
| GET | `/products/categories` | Authenticated | Distinct category list |
| GET | `/products/:id` | Authenticated | Single product |
| POST | `/products` | Admin, Manager | Create. Body: `name, sku, category, price, quantity, supplier?, description?, lowStockThreshold?` |
| PUT | `/products/:id` | Admin, Manager | Update |
| DELETE | `/products/:id` | Admin | Delete |

## Customers (CRM)

| Method | Endpoint | Roles | Description |
| --- | --- | --- | --- |
| GET | `/customers` | Authenticated | Query: `page, pageSize, search` |
| GET | `/customers/:id` | Authenticated | Single customer |
| GET | `/customers/:id/history` | Authenticated | Orders + spend stats |
| POST | `/customers` | Admin, Manager | Create. Body: `name, email, phone?, address?, company?` |
| PUT | `/customers/:id` | Admin, Manager | Update |
| DELETE | `/customers/:id` | Admin | Delete (blocked if orders exist) |

## Orders

| Method | Endpoint | Roles | Description |
| --- | --- | --- | --- |
| GET | `/orders` | Authenticated | Query: `page, pageSize, search, status, customerId` |
| GET | `/orders/:id` | Authenticated | Single order with items |
| POST | `/orders` | Admin, Manager | Create. Body: `customerId, notes?, items: [{ productId, quantity }]`. Decrements stock |
| PUT | `/orders/:id` | Admin, Manager | Update notes |
| PATCH | `/orders/:id/status` | Admin, Manager, Warehouse Staff | Body: `status` (PENDING -> PROCESSING -> SHIPPED -> DELIVERED) |
| DELETE | `/orders/:id` | Admin | Delete (restocks items) |

## Warehouse (WMS)

| Method | Endpoint | Roles | Description |
| --- | --- | --- | --- |
| GET | `/warehouse/inventory` | Authenticated | Current stock levels + low-stock flag |
| GET | `/warehouse/low-stock` | Authenticated | Products at/below threshold |
| GET | `/warehouse/history` | Authenticated | Query: `page, pageSize, productId, type` |
| POST | `/warehouse/stock-in` | Admin, Manager, Warehouse Staff | Body: `productId, quantity, reason?` |
| POST | `/warehouse/stock-out` | Admin, Manager, Warehouse Staff | Body: `productId, quantity, reason?` |

## Health

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Liveness probe used by Docker & the AWS ALB target group |

## Example: login with curl

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@wholesaleos.com", "password": "Admin@123" }'
```

## Example: create a product

```bash
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{ "name": "Denim Jacket", "sku": "DNM-JKT-001", "category": "Outerwear", "price": 49.99, "quantity": 120, "supplier": "BlueThread Co." }'
```
