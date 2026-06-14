-- WholesaleOS initial schema migration
-- This SQL is generated to match prisma/schema.prisma and is applied by
-- `prisma migrate deploy`. It can also be run manually against PostgreSQL.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'WAREHOUSE_STAFF');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED');
CREATE TYPE "TransactionType" AS ENUM ('STOCK_IN', 'STOCK_OUT');

-- CreateTable: users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'WAREHOUSE_STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: products
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "description" TEXT,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: customers
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: orders
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: order_items
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: inventory_transactions
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- Indexes & unique constraints
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");

CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE INDEX "products_name_idx" ON "products"("name");

CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
CREATE INDEX "customers_name_idx" ON "customers"("name");
CREATE INDEX "customers_company_idx" ON "customers"("company");

CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

CREATE UNIQUE INDEX "order_items_orderId_productId_key" ON "order_items"("orderId", "productId");
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

CREATE INDEX "inventory_transactions_productId_idx" ON "inventory_transactions"("productId");
CREATE INDEX "inventory_transactions_type_idx" ON "inventory_transactions"("type");
CREATE INDEX "inventory_transactions_createdAt_idx" ON "inventory_transactions"("createdAt");

-- Foreign keys
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
