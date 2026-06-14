/** Orders business logic with transactional stock handling. */
import { Prisma, OrderStatus, TransactionType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

interface ItemInput {
  productId: string;
  quantity: number;
}

async function generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const count = await tx.order.count();
  return `ORD-${(100001 + count).toString()}`;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  sortBy?: "orderNumber" | "totalAmount" | "status" | "createdAt";
  sortDir?: "asc" | "desc";
}

export async function list(params: ListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const where: Prisma.OrderWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.customerId) where.customerId = params.customerId;
  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: "insensitive" } },
      { customer: { name: { contains: params.search, mode: "insensitive" } } },
      { customer: { company: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? "desc";

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
      include: {
        customer: { select: { id: true, name: true, company: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
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

export async function getById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { id: true, name: true, email: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });
  if (!order) throw AppError.notFound("Order not found");
  return order;
}

/**
 * Create an order. Decrements stock and writes inventory transactions inside a
 * single DB transaction so the operation is atomic.
 */
export async function create(input: { customerId: string; notes?: string; items: ItemInput[] }, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw AppError.badRequest("Customer does not exist");

    // Merge duplicate productIds.
    const merged = new Map<string, number>();
    for (const it of input.items) {
      merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.quantity);
    }

    let total = 0;
    const itemRows: Prisma.OrderItemCreateManyOrderInput[] = [];

    for (const [productId, quantity] of merged) {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw AppError.badRequest(`Product ${productId} does not exist`);
      if (product.quantity < quantity) {
        throw AppError.badRequest(`Insufficient stock for "${product.name}" (have ${product.quantity}, need ${quantity})`);
      }
      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * quantity;
      total += lineTotal;
      itemRows.push({ productId, quantity, unitPrice, lineTotal });
    }

    const orderNumber = await generateOrderNumber(tx);
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: input.customerId,
        notes: input.notes,
        status: OrderStatus.PENDING,
        totalAmount: total,
        createdById: userId ?? null,
        items: { createMany: { data: itemRows } },
      },
    });

    // Decrement stock + record STOCK_OUT transactions.
    for (const row of itemRows) {
      const updated = await tx.product.update({
        where: { id: row.productId },
        data: { quantity: { decrement: row.quantity } },
      });
      await tx.inventoryTransaction.create({
        data: {
          productId: row.productId,
          type: TransactionType.STOCK_OUT,
          quantity: row.quantity,
          balanceAfter: updated.quantity,
          reason: `Order ${orderNumber}`,
          performedById: userId ?? null,
        },
      });
    }

    return tx.order.findUnique({
      where: { id: order.id },
      include: { customer: true, items: { include: { product: true } } },
    });
  });
}

/** Update order status with a simple forward-only workflow guard. */
export async function updateStatus(id: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw AppError.notFound("Order not found");

  const flow: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ];
  const currentIdx = flow.indexOf(order.status);
  const nextIdx = flow.indexOf(status);
  if (nextIdx < currentIdx) {
    throw AppError.badRequest(`Cannot move an order from ${order.status} back to ${status}`);
  }

  return prisma.order.update({
    where: { id },
    data: { status },
    include: { customer: true },
  });
}

/** Update editable order fields (customer, notes, status). */
export async function update(id: string, input: { customerId?: string; notes?: string | null; status?: OrderStatus }) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw AppError.notFound("Order not found");

  if (input.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw AppError.badRequest("Customer does not exist");
  }

  return prisma.order.update({
    where: { id },
    data: {
      customerId: input.customerId,
      notes: input.notes,
      status: input.status,
    },
    include: { customer: true, items: { include: { product: true } } },
  });
}

/** Delete an order and restock its items atomically. */
export async function remove(id: string, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw AppError.notFound("Order not found");

    for (const item of order.items) {
      const updated = await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
      await tx.inventoryTransaction.create({
        data: {
          productId: item.productId,
          type: TransactionType.STOCK_IN,
          quantity: item.quantity,
          balanceAfter: updated.quantity,
          reason: `Order ${order.orderNumber} cancelled`,
          performedById: userId ?? null,
        },
      });
    }
    await tx.order.delete({ where: { id } });
  });
}
