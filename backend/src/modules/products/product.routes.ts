import { Router } from "express";
import { Role } from "@prisma/client";
import * as controller from "./product.controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
  idParamSchema,
} from "./product.validation";

const router = Router();

// All product routes require authentication.
router.use(authenticate);

router.get("/", validate(listProductsSchema), asyncHandler(controller.list));
router.get("/categories", asyncHandler(controller.categories));
router.get("/:id", validate(idParamSchema), asyncHandler(controller.getById));

// Mutations restricted to Admin + Manager.
router.post("/", authorize(Role.ADMIN, Role.MANAGER), validate(createProductSchema), asyncHandler(controller.create));
router.put("/:id", authorize(Role.ADMIN, Role.MANAGER), validate(updateProductSchema), asyncHandler(controller.update));
router.delete("/:id", authorize(Role.ADMIN), validate(idParamSchema), asyncHandler(controller.remove));

export default router;
