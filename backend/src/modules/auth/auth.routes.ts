import { Router } from "express";
import * as controller from "./auth.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { registerSchema, loginSchema, refreshSchema } from "./auth.validation";

const router = Router();

// Public: self-registration (always created as WAREHOUSE_STAFF unless an Admin
// token is supplied — handled in the controller).
router.post("/register", validate(registerSchema), asyncHandler(controller.register));
router.post("/login", validate(loginSchema), asyncHandler(controller.login));
router.post("/refresh", validate(refreshSchema), asyncHandler(controller.refresh));

// Protected
router.post("/logout", authenticate, asyncHandler(controller.logout));
router.get("/me", authenticate, asyncHandler(controller.me));

export default router;
