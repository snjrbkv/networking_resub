/** Aggregates all module routers under /api. */
import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import productRoutes from "../modules/products/product.routes";
import customerRoutes from "../modules/customers/customer.routes";
import orderRoutes from "../modules/orders/order.routes";
import warehouseRoutes from "../modules/warehouse/warehouse.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "WholesaleOS API",
    version: "1.0.0",
    endpoints: ["/auth", "/dashboard", "/products", "/customers", "/orders", "/warehouse"],
  });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/products", productRoutes);
router.use("/customers", customerRoutes);
router.use("/orders", orderRoutes);
router.use("/warehouse", warehouseRoutes);

export default router;
