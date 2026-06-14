/** Server bootstrap — starts the HTTP server and handles graceful shutdown. */
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { prisma } from "./config/prisma";

async function bootstrap() {
  const app = createApp();

  // Verify DB connectivity before accepting traffic.
  try {
    await prisma.$connect();
    logger.info("\u2714 Connected to PostgreSQL");
  } catch (err) {
    logger.error(`Failed to connect to the database: ${(err as Error).message}`);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    logger.info(`\uD83D\uDE80 WholesaleOS API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info("Closed remaining connections. Bye.");
      process.exit(0);
    });
    // Force-exit if shutdown hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap();
