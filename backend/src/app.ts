/** Express application factory — wires up security, middleware, and routes. */
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { morganStream } from "./utils/logger";
import apiRoutes from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

export function createApp(): Application {
  const app = express();

  // Trust the first proxy (AWS ALB) so rate-limiting & IPs work behind a load balancer.
  app.set("trust proxy", 1);

  // ─── Security headers ───
  app.use(helmet());

  // ─── CORS ─── (comma-separated origins supported)
  const allowedOrigins = env.corsOrigin.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: allowedOrigins.length === 1 && allowedOrigins[0] === "*" ? true : allowedOrigins,
      credentials: true,
    })
  );

  // ─── Body parsing & compression ───
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(compression());

  // ─── HTTP request logging ───
  app.use(morgan(env.isProduction ? "combined" : "dev", { stream: morganStream }));

  // ─── Rate limiting (applied to the API surface) ───
  const limiter = rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
  });
  app.use("/api", limiter);

  // ─── Health check (used by Docker & the AWS ALB target group) ───
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  // ─── API routes ───
  app.use("/api", apiRoutes);

  // ─── 404 + error handling (must be last) ───
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
