/** Auth HTTP controllers. */
import { Request, Response } from "express";
import { Role } from "@prisma/client";
import * as authService from "./auth.service";
import { AppError } from "../../utils/AppError";

export async function register(req: Request, res: Response) {
  // Only an authenticated Admin may assign a role other than the default.
  let role: Role | undefined = req.body.role;
  if (role && req.user?.role !== Role.ADMIN) {
    throw AppError.forbidden("Only an Admin can assign roles");
  }
  const result = await authService.register({ ...req.body, role });
  res.status(201).json({ success: true, data: result });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json({ success: true, data: result });
}

export async function refresh(req: Request, res: Response) {
  const result = await authService.refresh(req.body.refreshToken);
  res.json({ success: true, data: result });
}

export async function logout(req: Request, res: Response) {
  await authService.logout(req.user!.id);
  res.json({ success: true, message: "Logged out successfully" });
}

export async function me(req: Request, res: Response) {
  const profile = await authService.getProfile(req.user!.id);
  res.json({ success: true, data: profile });
}
