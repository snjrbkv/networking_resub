import { Router } from "express";
import { Role } from "@prisma/client";
import * as controller from "./customer.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersSchema,
  idParamSchema,
} from "./customer.validation";

const router = Router();
router.use(authenticate);

router.get("/", validate(listCustomersSchema), asyncHandler(controller.list));
router.get("/:id", validate(idParamSchema), asyncHandler(controller.getById));
router.get("/:id/history", validate(idParamSchema), asyncHandler(controller.history));

// Mutations restricted to Admin + Manager.
router.post("/", authorize(Role.ADMIN, Role.MANAGER), validate(createCustomerSchema), asyncHandler(controller.create));
router.put("/:id", authorize(Role.ADMIN, Role.MANAGER), validate(updateCustomerSchema), asyncHandler(controller.update));
router.delete("/:id", authorize(Role.ADMIN), validate(idParamSchema), asyncHandler(controller.remove));

export default router;
