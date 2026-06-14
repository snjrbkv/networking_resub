/** Dashboard aggregation logic. */
import { prisma } from "../../config/prisma";

export async function summary() {
  const [totalProducts, totalCustomers, totalOrders, revenueAgg, products, recentOrders] =
    await Promise.all([
      prisma.product.count(),
      prisma.customer.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.product.findMany({ orderBy: { quantity: "asc" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: { select: { id: true, name: true, company: true } } },
      }),
    ]);

  const lowStockProducts = products
    .filter((p) => p.quantity <= p.lowStockThreshold)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, quantity: p.quantity, lowStockThreshold: p.lowStockThreshold }));

  // Orders grouped by status for a quick chart on the dashboard.
  const statusGroups = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const ordersByStatus = statusGroups.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = g._count._all;
    return acc;
  }, {});

  return {
    totals: {
      products: totalProducts,
      customers: totalCustomers,
      orders: totalOrders,
      revenue: Number(revenueAgg._sum.totalAmount ?? 0),
    },
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    ordersByStatus,
    recentOrders,
  };
}
