import { Router } from "express";
import { Role } from "@prisma/client";
import * as controller from "./warehouse.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { stockMovementSchema, listHistorySchema } from "./warehouse.validation";

const router = Router();
router.use(authenticate);

router.get("/inventory", asyncHandler(controller.inventory));
router.get("/low-stock", asyncHandler(controller.lowStock));
router.get("/history", validate(listHistorySchema), asyncHandler(controller.history));

// Stock movements: all roles incl. Warehouse Staff may perform them.
router.post(
  "/stock-in",
  authorize(Role.ADMIN, Role.MANAGER, Role.WAREHOUSE_STAFF),
  validate(stockMovementSchema),
  asyncHandler(controller.stockIn)
);
router.post(
  "/stock-out",
  authorize(Role.ADMIN, Role.MANAGER, Role.WAREHOUSE_STAFF),
  validate(stockMovementSchema),
  asyncHandler(controller.stockOut)
);

export default router;
