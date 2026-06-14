/**
 * Centralised, validated environment configuration.
 * Throws early at startup if required variables are missing.
 */
import dotenv from "dotenv";

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
  port: optionalNumber("PORT", 4000),
  databaseUrl: required("DATABASE_URL", "postgresql://wholesale:wholesale_secret@localhost:5432/wholesaleos?schema=public"),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  rateLimit: {
    windowMs: optionalNumber("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
    max: optionalNumber("RATE_LIMIT_MAX", 300),
  },
  logLevel: process.env.LOG_LEVEL ?? "info",
} as const;
