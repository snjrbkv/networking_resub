/** Warehouse Management (WMS) business logic. */
import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

/** Stock In — increase a product's quantity and log the transaction. */
export async function stockIn(productId: string, quantity: number, reason: string | undefined, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw AppError.notFound("Product not found");

    const updated = await tx.product.update({
      where: { id: productId },
      data: { quantity: { increment: quantity } },
    });
    const transaction = await tx.inventoryTransaction.create({
      data: {
        productId,
        type: TransactionType.STOCK_IN,
        quantity,
        balanceAfter: updated.quantity,
        reason: reason ?? "Manual stock in",
        performedById: userId ?? null,
      },
    });
    return { product: updated, transaction };
  });
}

/** Stock Out — decrease a product's quantity (guards against negative stock). */
export async function stockOut(productId: string, quantity: number, reason: string | undefined, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw AppError.notFound("Product not found");
    if (product.quantity < quantity) {
      throw AppError.badRequest(`Insufficient stock (have ${product.quantity}, requested ${quantity})`);
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: { quantity: { decrement: quantity } },
    });
    const transaction = await tx.inventoryTransaction.create({
      data: {
        productId,
        type: TransactionType.STOCK_OUT,
        quantity,
        balanceAfter: updated.quantity,
        reason: reason ?? "Manual stock out",
        performedById: userId ?? null,
      },
    });
    return { product: updated, transaction };
  });
}

export interface HistoryParams {
  page?: number;
  pageSize?: number;
  productId?: string;
  type?: TransactionType;
}

/** Inventory history (audit trail of all stock movements). */
export async function history(params: HistoryParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.InventoryTransactionWhereInput = {};
  if (params.productId) where.productId = params.productId;
  if (params.type) where.type = params.type;

  const [data, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        performedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

/** Current inventory levels with a low-stock flag. */
export async function inventory() {
  const products = await prisma.product.findMany({ orderBy: { quantity: "asc" } });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    quantity: p.quantity,
    lowStockThreshold: p.lowStockThreshold,
    isLowStock: p.quantity <= p.lowStockThreshold,
  }));
}

/** Products at or below their low-stock threshold. */
export async function lowStock() {
  const products = await prisma.product.findMany({ orderBy: { quantity: "asc" } });
  return products
    .filter((p) => p.quantity <= p.lowStockThreshold)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      quantity: p.quantity,
      lowStockThreshold: p.lowStockThreshold,
    }));
}
