import mongoose from 'mongoose';

import { logger } from '../lib/logger.js';
import { env, isProduction } from './env.js';

export type DatabaseStatus = 'disconnected' | 'connected' | 'connecting' | 'disconnecting';

const { ConnectionStates } = mongoose;

const READY_STATES: Partial<Record<mongoose.ConnectionStates, DatabaseStatus>> = {
  [ConnectionStates.disconnected]: 'disconnected',
  [ConnectionStates.connected]: 'connected',
  [ConnectionStates.connecting]: 'connecting',
  [ConnectionStates.disconnecting]: 'disconnecting',
};

let listenersRegistered = false;

/**
 * Driver errors embed the full cluster topology, which floods logs; keep the useful parts.
 */
export function summarizeDatabaseError(error: unknown): { name: string; message: string } {
  return error instanceof Error
    ? { name: error.name, message: error.message }
    : { name: 'UnknownError', message: String(error) };
}

/** Lifecycle logging for an established connection; startup failures are reported by the caller. */
function registerConnectionListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  const { connection } = mongoose;
  connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
  connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
  connection.on('error', (error: unknown) => {
    logger.error({ err: summarizeDatabaseError(error) }, 'MongoDB connection error');
  });
}

export async function connectDatabase(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  // Index builds on startup are convenient locally but should be managed explicitly in production.
  mongoose.set('autoIndex', !isProduction);

  const instance = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5_000,
    maxPoolSize: 10,
  });

  registerConnectionListeners();
  logger.info({ db: instance.connection.name }, 'MongoDB connected');
  return instance;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== ConnectionStates.disconnected) {
    await mongoose.disconnect();
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  return READY_STATES[mongoose.connection.readyState] ?? 'disconnected';
}
