/**
 * Seed script — idempotent.
 * Creates default users (Admin / Manager / Warehouse Staff), products,
 * customers, a sample order, and inventory transactions.
 *
 * Run with:  npm run seed   (or automatically via docker-compose)
 */
import { PrismaClient, Role, OrderStatus, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("\u23F3 Seeding database...");

  // ─── Users ───
  const users = [
    { name: "System Admin", email: "admin@wholesaleos.com", password: "Admin@123", role: Role.ADMIN },
    { name: "Store Manager", email: "manager@wholesaleos.com", password: "Manager@123", role: Role.MANAGER },
    { name: "Warehouse Staff", email: "staff@wholesaleos.com", password: "Staff@123", role: Role.WAREHOUSE_STAFF },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    });
  }
  console.log(`\u2714 Seeded ${users.length} users`);

  // ─── Products (wholesale clothing) ───
  const products = [
    { name: "Classic Cotton T-Shirt", sku: "TSH-WHT-001", category: "T-Shirts", price: 6.5, quantity: 1200, supplier: "Anatolia Textiles", description: "180gsm white crew-neck, bulk pack" },
    { name: "Slim Fit Denim Jeans", sku: "JNS-BLU-014", category: "Jeans", price: 14.9, quantity: 540, supplier: "DenimWorks Ltd", description: "Stretch indigo denim, assorted sizes" },
    { name: "Fleece Hoodie", sku: "HOD-GRY-022", category: "Hoodies", price: 18.0, quantity: 8, supplier: "NordKnit", description: "Heavy fleece, grey marl" },
    { name: "Polo Shirt Pique", sku: "POL-NVY-009", category: "Polos", price: 9.25, quantity: 320, supplier: "Anatolia Textiles", description: "Navy pique, embroidered ready" },
    { name: "Summer Linen Dress", sku: "DRS-BEI-031", category: "Dresses", price: 22.5, quantity: 6, supplier: "Riviera Apparel", description: "Beige linen midi dress" },
    { name: "Wool Blend Scarf", sku: "ACC-RED-040", category: "Accessories", price: 5.75, quantity: 900, supplier: "NordKnit", description: "Red wool-blend, unisex" },
    { name: "Athletic Shorts", sku: "SHT-BLK-018", category: "Shorts", price: 7.4, quantity: 75, supplier: "DenimWorks Ltd", description: "Black quick-dry shorts" },
    { name: "Oxford Button-Down", sku: "SHI-WHT-027", category: "Shirts", price: 12.6, quantity: 210, supplier: "Riviera Apparel", description: "White oxford, business casual" },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }
  console.log(`\u2714 Seeded ${products.length} products`);

  // ─── Customers ───
  const customers = [
    { name: "Aziz Karimov", email: "aziz@retailhub.uz", phone: "+998901234567", address: "Amir Temur St 12, Tashkent", company: "RetailHub LLC" },
    { name: "Bella Moda", email: "orders@bellamoda.it", phone: "+390612345678", address: "Via Roma 5, Milan", company: "Bella Moda SRL" },
    { name: "Urban Threads", email: "buy@urbanthreads.co", phone: "+14155550123", address: "500 Market St, San Francisco", company: "Urban Threads Inc" },
    { name: "Nordic Style", email: "info@nordicstyle.se", phone: "+46812345678", address: "Kungsgatan 8, Stockholm", company: "Nordic Style AB" },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: c,
    });
  }
  console.log(`\u2714 Seeded ${customers.length} customers`);

  // ─── A sample order (only if none exist) ───
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    const admin = await prisma.user.findUnique({ where: { email: "admin@wholesaleos.com" } });
    const customer = await prisma.customer.findUnique({ where: { email: "aziz@retailhub.uz" } });
    const tshirt = await prisma.product.findUnique({ where: { sku: "TSH-WHT-001" } });
    const polo = await prisma.product.findUnique({ where: { sku: "POL-NVY-009" } });

    if (customer && tshirt && polo) {
      const qtyA = 100;
      const qtyB = 50;
      const lineA = Number(tshirt.price) * qtyA;
      const lineB = Number(polo.price) * qtyB;
      await prisma.order.create({
        data: {
          orderNumber: "ORD-100001",
          customerId: customer.id,
          status: OrderStatus.PROCESSING,
          totalAmount: lineA + lineB,
          notes: "First wholesale order — seeded sample",
          createdById: admin?.id ?? null,
          items: {
            create: [
              { productId: tshirt.id, quantity: qtyA, unitPrice: tshirt.price, lineTotal: lineA },
              { productId: polo.id, quantity: qtyB, unitPrice: polo.price, lineTotal: lineB },
            ],
          },
        },
      });
      console.log("\u2714 Seeded 1 sample order");
    }
  }

  // ─── Inventory transactions (only if none exist) ───
  const existingTx = await prisma.inventoryTransaction.count();
  if (existingTx === 0) {
    const hoodie = await prisma.product.findUnique({ where: { sku: "HOD-GRY-022" } });
    if (hoodie) {
      await prisma.inventoryTransaction.create({
        data: {
          productId: hoodie.id,
          type: TransactionType.STOCK_IN,
          quantity: 8,
          balanceAfter: hoodie.quantity,
          reason: "Initial stock receipt",
        },
      });
      console.log("\u2714 Seeded inventory transactions");
    }
  }

  console.log("\u2705 Seeding complete.");
}

main()
  .catch((e) => {
    console.error("\u274C Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
