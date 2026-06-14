import { Router } from "express";
import { Role } from "@prisma/client";
import * as controller from "./order.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createOrderSchema,
  updateOrderSchema,
  updateStatusSchema,
  listOrdersSchema,
  idParamSchema,
} from "./order.validation";

const router = Router();
router.use(authenticate);

router.get("/", validate(listOrdersSchema), asyncHandler(controller.list));
router.get("/:id", validate(idParamSchema), asyncHandler(controller.getById));

// Create / edit allowed for Admin + Manager.
router.post("/", authorize(Role.ADMIN, Role.MANAGER), validate(createOrderSchema), asyncHandler(controller.create));
router.put("/:id", authorize(Role.ADMIN, Role.MANAGER), validate(updateOrderSchema), asyncHandler(controller.update));

// Status updates also allowed for Warehouse Staff (fulfilment workflow).
router.patch(
  "/:id/status",
  authorize(Role.ADMIN, Role.MANAGER, Role.WAREHOUSE_STAFF),
  validate(updateStatusSchema),
  asyncHandler(controller.updateStatus)
);

router.delete("/:id", authorize(Role.ADMIN), validate(idParamSchema), asyncHandler(controller.remove));

export default router;
