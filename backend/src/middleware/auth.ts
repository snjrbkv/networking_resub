/** Authentication middleware — verifies the JWT access token. */
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing or malformed Authorization header"));
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return next(AppError.unauthorized("Invalid or expired access token"));
  }
}
