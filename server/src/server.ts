import type { Server } from 'node:http';

import { createApp } from './app.js';
import {
  connectDatabaseWithRetry,
  disconnectDatabase,
  summarizeDatabaseError,
} from './config/database.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: Server | undefined;
let shuttingDown = false;

async function start(): Promise<void> {
  registerShutdownHandlers();

  try {
    // API traffic is only accepted once the initial database connection has succeeded.
    await connectDatabaseWithRetry();
  } catch (error) {
    if (shuttingDown) return;
    logger.fatal({ err: summarizeDatabaseError(error) }, 'Unable to connect to MongoDB');
    process.exit(1);
  }

  if (shuttingDown) return;

  server = createApp().listen(env.PORT, () => {
    logger.info(`DevFlow API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  server.on('error', (error) => {
    logger.fatal({ err: error }, 'HTTP server failed to start');
    void shutdown('serverError', 1);
  });
}

function closeHttpServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server?.listening) {
      resolve();
      return;
    }
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function shutdown(reason: string, exitCode = 0): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ reason }, 'Shutting down gracefully');

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  let code = exitCode;

  try {
    await closeHttpServer();
  } catch (error) {
    logger.error({ err: error }, 'Error while closing HTTP server');
    code = 1;
  }

  try {
    await disconnectDatabase();
  } catch (error) {
    logger.error({ err: summarizeDatabaseError(error) }, 'Error while closing MongoDB connection');
    code = 1;
  }

  process.exit(code);
}

function registerShutdownHandlers(): void {
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    void shutdown('uncaughtException', 1);
  });
}

void start();
