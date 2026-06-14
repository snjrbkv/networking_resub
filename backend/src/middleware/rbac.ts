/** Role-Based Access Control middleware. */
import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../utils/AppError";

/**
 * Restrict a route to one or more roles.
 * Usage: router.post('/', authorize(Role.ADMIN, Role.MANAGER), handler)
 */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(AppError.forbidden("You do not have permission to perform this action"));
    }
    return next();
  };
}
