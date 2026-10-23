import type { Server } from 'node:http';

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase, summarizeDatabaseError } from './config/database.js';
import { env, isProduction } from './config/env.js';
import { logger } from './lib/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;
const DB_RETRY_INTERVAL_MS = 15_000;

/** Retries the initial connection in the background (mongoose does not retry a failed first connect). */
function scheduleDatabaseRetry(): void {
  const timer = setTimeout(() => {
    connectDatabase().catch(() => {
      scheduleDatabaseRetry();
    });
  }, DB_RETRY_INTERVAL_MS);
  timer.unref();
}

async function start(): Promise<void> {
  try {
    await connectDatabase();
  } catch (error) {
    if (isProduction) {
      logger.fatal({ err: summarizeDatabaseError(error) }, 'Unable to connect to MongoDB');
      process.exit(1);
    }
    // Outside production the API stays up in a degraded state so frontend work isn't blocked;
    // the health endpoint reports the database as disconnected until a retry succeeds.
    logger.warn(
      { err: summarizeDatabaseError(error) },
      `Unable to connect to MongoDB, running in degraded mode (retrying every ${DB_RETRY_INTERVAL_MS / 1000}s)`,
    );
    scheduleDatabaseRetry();
  }

  const server = createApp().listen(env.PORT, () => {
    logger.info(`DevFlow API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  server.on('error', (error) => {
    logger.fatal({ err: error }, 'HTTP server failed to start');
    process.exit(1);
  });

  registerShutdownHandlers(server);
}

function registerShutdownHandlers(server: Server): void {
  let shuttingDown = false;

  const shutdown = (reason: string, exitCode = 0): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ reason }, 'Shutting down gracefully');

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close((closeError) => {
      disconnectDatabase()
        .then(() => {
          process.exit(closeError ? 1 : exitCode);
        })
        .catch((error: unknown) => {
          logger.error({ err: error }, 'Error while closing MongoDB connection');
          process.exit(1);
        });
    });
  };

  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    shutdown('uncaughtException', 1);
  });
}

void start();
