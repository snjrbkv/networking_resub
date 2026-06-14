/** Winston-based application logger. */
import winston from "winston";
import { env } from "../config/env";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} [${level}] ${stack || message}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: env.logLevel,
  format: env.isProduction ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
});

// Stream adapter so morgan HTTP logs flow through winston.
export const morganStream = {
  write: (message: string) => logger.http?.(message.trim()) ?? logger.info(message.trim()),
};
