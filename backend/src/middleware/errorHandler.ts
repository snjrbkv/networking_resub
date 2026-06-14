/** Centralised error-handling + 404 middleware. */
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Map common Prisma errors to friendly HTTP responses.
    if (err.code === "P2002") {
      statusCode = 409;
      const target = (err.meta?.target as string[] | undefined)?.join(", ");
      message = `A record with this ${target ?? "value"} already exists`;
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
    } else if (err.code === "P2003") {
      statusCode = 409;
      message = "Operation violates a foreign-key constraint";
    } else {
      statusCode = 400;
      message = "Database request error";
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid database query";
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error(err instanceof Error ? err.stack || err.message : String(err));
  } else {
    logger.warn(`${statusCode} ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.isProduction ? {} : { stack: err instanceof Error ? err.stack : undefined }),
  });
}
