/** Customer (CRM) business logic. */
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "name" | "company" | "createdAt";
  sortDir?: "asc" | "desc";
}

export async function list(params: ListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const where: Prisma.CustomerWhereInput = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { company: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? "desc";

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
      include: { _count: { select: { orders: true } } },
    }),
    prisma.customer.count({ where }),
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
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw AppError.notFound("Customer not found");
  return customer;
}

/** Customer history — the customer plus their full order history. */
export async function getHistory(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      },
    },
  });
  if (!customer) throw AppError.notFound("Customer not found");

  const totalSpent = customer.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      company: customer.company,
      createdAt: customer.createdAt,
    },
    stats: {
      totalOrders: customer.orders.length,
      totalSpent,
    },
    orders: customer.orders,
  };
}

export async function create(input: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
}) {
  return prisma.customer.create({ data: input });
}

export async function update(id: string, input: Record<string, unknown>) {
  await getById(id);
  return prisma.customer.update({ where: { id }, data: input });
}

export async function remove(id: string) {
  await getById(id);
  const orderCount = await prisma.order.count({ where: { customerId: id } });
  if (orderCount > 0) {
    throw AppError.conflict("Cannot delete a customer with existing orders");
  }
  await prisma.customer.delete({ where: { id } });
}
