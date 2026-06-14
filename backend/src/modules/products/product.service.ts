/** Product (ERP) business logic with search, filtering, and pagination. */
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  lowStock?: "true" | "false";
  sortBy?: "name" | "price" | "quantity" | "createdAt";
  sortDir?: "asc" | "desc";
}

export async function list(params: ListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { sku: { contains: params.search, mode: "insensitive" } },
      { supplier: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.category) where.category = params.category;

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? "desc";

  // Fetch then optionally filter low-stock in memory (threshold is per-row).
  const [allMatching, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
    }),
    prisma.product.count({ where }),
  ]);

  let rows = allMatching;
  let count = total;
  if (params.lowStock === "true") {
    rows = allMatching.filter((p) => p.quantity <= p.lowStockThreshold);
    count = rows.length;
  }

  const paged = rows.slice(skip, skip + pageSize);

  return {
    data: paged,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
    },
  };
}

export async function getById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw AppError.notFound("Product not found");
  return product;
}

export async function create(input: {
  name: string;
  sku: string;
  category: string;
  price: number;
  quantity?: number;
  supplier?: string;
  description?: string;
  lowStockThreshold?: number;
}) {
  return prisma.product.create({
    data: {
      name: input.name,
      sku: input.sku,
      category: input.category,
      price: input.price,
      quantity: input.quantity ?? 0,
      supplier: input.supplier,
      description: input.description,
      lowStockThreshold: input.lowStockThreshold ?? 10,
    },
  });
}

export async function update(id: string, input: Record<string, unknown>) {
  await getById(id);
  return prisma.product.update({ where: { id }, data: input });
}

export async function remove(id: string) {
  await getById(id);
  await prisma.product.delete({ where: { id } });
}

export async function categories() {
  const rows = await prisma.product.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}
