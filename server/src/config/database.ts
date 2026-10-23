import { setTimeout as delay } from 'node:timers/promises';

import mongoose from 'mongoose';

import { logger } from '../lib/logger.js';
import { env, isProduction, MONGODB_URI_PATTERN } from './env.js';

export type DatabaseStatus = 'disconnected' | 'connected' | 'connecting' | 'disconnecting';

export interface DatabaseConfig {
  uri: string;
  /** How long the driver waits for a reachable server before failing. */
  serverSelectionTimeoutMS: number;
  maxPoolSize: number;
  /** Extra attempts for the initial connection (mongoose does not retry a failed first connect). */
  connectRetries: number;
  retryDelayMs: number;
}

export const databaseConfig: Readonly<DatabaseConfig> = Object.freeze({
  uri: env.MONGODB_URI,
  serverSelectionTimeoutMS: 5_000,
  maxPoolSize: 10,
  connectRetries: 4,
  retryDelayMs: 3_000,
});

/** Invalid configuration is not retried; messages never include the connection string. */
export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConfigError';
  }
}

const { ConnectionStates } = mongoose;

const READY_STATES: Partial<Record<mongoose.ConnectionStates, DatabaseStatus>> = {
  [ConnectionStates.disconnected]: 'disconnected',
  [ConnectionStates.connected]: 'connected',
  [ConnectionStates.connecting]: 'connecting',
  [ConnectionStates.disconnecting]: 'disconnecting',
};

let listenersRegistered = false;
let closingIntentionally = false;

export function validateDatabaseConfig(config: DatabaseConfig): void {
  if (!MONGODB_URI_PATTERN.test(config.uri.trim())) {
    throw new DatabaseConfigError(
      'MongoDB URI is missing or invalid (expected mongodb:// or mongodb+srv://)',
    );
  }
  if (!Number.isInteger(config.serverSelectionTimeoutMS) || config.serverSelectionTimeoutMS <= 0) {
    throw new DatabaseConfigError('serverSelectionTimeoutMS must be a positive integer');
  }
  if (!Number.isInteger(config.maxPoolSize) || config.maxPoolSize <= 0) {
    throw new DatabaseConfigError('maxPoolSize must be a positive integer');
  }
  if (!Number.isInteger(config.connectRetries) || config.connectRetries < 0) {
    throw new DatabaseConfigError('connectRetries must be a non-negative integer');
  }
  if (!Number.isInteger(config.retryDelayMs) || config.retryDelayMs < 0) {
    throw new DatabaseConfigError('retryDelayMs must be a non-negative integer');
  }
}

/** Masks `user:password@` in any MongoDB connection string embedded in the text. */
export function redactConnectionString(text: string): string {
  return text.replace(/(mongodb(?:\+srv)?:\/\/)[^\s@/]+@/gi, '$1***@');
}

/**
 * Driver errors embed the full cluster topology, which floods logs; keep the useful parts.
 */
export function summarizeDatabaseError(error: unknown): { name: string; message: string } {
  return error instanceof Error
    ? { name: error.name, message: redactConnectionString(error.message) }
    : { name: 'UnknownError', message: redactConnectionString(String(error)) };
}

/** Lifecycle logging for an established connection; startup failures are reported by the caller. */
function registerConnectionListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  const { connection } = mongoose;
  connection.on('disconnected', () => {
    if (closingIntentionally) return;
    logger.warn('MongoDB disconnected');
  });
  connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
  connection.on('error', (error: unknown) => {
    logger.error({ err: summarizeDatabaseError(error) }, 'MongoDB connection error');
  });
}

export async function connectDatabase(
  config: DatabaseConfig = databaseConfig,
): Promise<typeof mongoose> {
  validateDatabaseConfig(config);

  mongoose.set('strictQuery', true);
  // Index builds on startup are convenient locally but should be managed explicitly in production.
  mongoose.set('autoIndex', !isProduction);

  const instance = await mongoose.connect(config.uri.trim(), {
    serverSelectionTimeoutMS: config.serverSelectionTimeoutMS,
    maxPoolSize: config.maxPoolSize,
  });

  registerConnectionListeners();
  const { host, port, name } = instance.connection;
  logger.info({ host, port, db: name }, 'MongoDB connected');
  return instance;
}

/** Connects with a bounded number of retries; rejects with the last error once they run out. */
export async function connectDatabaseWithRetry(
  config: DatabaseConfig = databaseConfig,
): Promise<typeof mongoose> {
  validateDatabaseConfig(config);
  const maxAttempts = config.connectRetries + 1;

  for (let attempt = 1; ; attempt++) {
    try {
      return await connectDatabase(config);
    } catch (error) {
      if (attempt >= maxAttempts) throw error;
      logger.warn(
        { err: summarizeDatabaseError(error), attempt, maxAttempts },
        `MongoDB connection attempt failed, retrying in ${config.retryDelayMs}ms`,
      );
      await delay(config.retryDelayMs);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === ConnectionStates.disconnected) return;

  closingIntentionally = true;
  try {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed');
  } finally {
    closingIntentionally = false;
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  return READY_STATES[mongoose.connection.readyState] ?? 'disconnected';
}
