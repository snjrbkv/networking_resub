import { Router } from "express";
import * as controller from "./dashboard.controller";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(controller.summary));

export default router;
