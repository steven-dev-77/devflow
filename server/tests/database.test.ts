import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  connectDatabase,
  connectDatabaseWithRetry,
  databaseConfig,
  DatabaseConfigError,
  disconnectDatabase,
  getDatabaseStatus,
  redactConnectionString,
  summarizeDatabaseError,
  validateDatabaseConfig,
  type DatabaseConfig,
} from '../src/config/database.js';
import { logger } from '../src/lib/logger.js';

const SECRET_URI = 'mongodb://admin:s3cret@db.example.com:27017/devflow';

function buildConfig(overrides: Partial<DatabaseConfig> = {}): DatabaseConfig {
  return { ...databaseConfig, uri: SECRET_URI, retryDelayMs: 0, ...overrides };
}

/** Every argument passed to the logger, serialized, so secrets can be searched for. */
function loggedOutput(...spies: { mock: { calls: unknown[][] } }[]): string {
  return JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
}

describe('database configuration', () => {
  it('accepts the configuration loaded from the environment', () => {
    expect(() => {
      validateDatabaseConfig(databaseConfig);
    }).not.toThrow();
    expect(databaseConfig.uri).toBe(process.env.MONGODB_URI);
  });

  it.each(['', '   ', 'http://localhost:27017/devflow', 'mongodb://'])(
    'rejects invalid URI %j without echoing it',
    (uri) => {
      expect(() => {
        validateDatabaseConfig(buildConfig({ uri }));
      }).toThrow(DatabaseConfigError);
    },
  );

  it('rejects invalid numeric options', () => {
    expect(() => {
      validateDatabaseConfig(buildConfig({ maxPoolSize: 0 }));
    }).toThrow(/maxPoolSize/);
    expect(() => {
      validateDatabaseConfig(buildConfig({ connectRetries: -1 }));
    }).toThrow(/connectRetries/);
  });
});

describe('credential redaction', () => {
  it('masks credentials in connection strings', () => {
    expect(redactConnectionString(`failed to reach ${SECRET_URI}`)).toBe(
      'failed to reach mongodb://***@db.example.com:27017/devflow',
    );
    expect(redactConnectionString('mongodb+srv://u:p@cluster0.example.net/app')).toBe(
      'mongodb+srv://***@cluster0.example.net/app',
    );
  });

  it('leaves strings without credentials unchanged', () => {
    expect(redactConnectionString('mongodb://127.0.0.1:27017/devflow')).toBe(
      'mongodb://127.0.0.1:27017/devflow',
    );
  });

  it('summarizes errors without leaking credentials', () => {
    expect(summarizeDatabaseError(new Error(`bad uri ${SECRET_URI}`))).toEqual({
      name: 'Error',
      message: 'bad uri mongodb://***@db.example.com:27017/devflow',
    });
    expect(summarizeDatabaseError('boom')).toEqual({ name: 'UnknownError', message: 'boom' });
  });
});

describe('connection lifecycle', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'info');
    vi.spyOn(logger, 'warn');
    vi.spyOn(logger, 'error');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('connects with the configured options and logs success without credentials', async () => {
    const connect = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

    await connectDatabase(buildConfig());

    expect(connect).toHaveBeenCalledOnce();
    expect(connect).toHaveBeenCalledWith(SECRET_URI, {
      serverSelectionTimeoutMS: databaseConfig.serverSelectionTimeoutMS,
      maxPoolSize: databaseConfig.maxPoolSize,
    });
    expect(logger.info).toHaveBeenCalledWith(expect.any(Object), 'MongoDB connected');
    expect(loggedOutput(vi.mocked(logger.info))).not.toContain('s3cret');
  });

  it('does not attempt to connect when configuration is invalid', async () => {
    const connect = vi.spyOn(mongoose, 'connect');

    await expect(connectDatabase(buildConfig({ uri: 'not-a-uri' }))).rejects.toBeInstanceOf(
      DatabaseConfigError,
    );
    expect(connect).not.toHaveBeenCalled();
  });

  it('propagates connection failures to the caller', async () => {
    const failure = new Error('connect ECONNREFUSED');
    vi.spyOn(mongoose, 'connect').mockRejectedValue(failure);

    await expect(connectDatabase(buildConfig())).rejects.toBe(failure);
    expect(logger.info).not.toHaveBeenCalledWith(expect.anything(), 'MongoDB connected');
  });

  it('retries the initial connection until it succeeds', async () => {
    const connect = vi
      .spyOn(mongoose, 'connect')
      .mockRejectedValueOnce(new Error('unreachable'))
      .mockResolvedValue(mongoose);

    await connectDatabaseWithRetry(buildConfig({ connectRetries: 2 }));

    expect(connect).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ attempt: 1, maxAttempts: 3 }),
      expect.stringContaining('retrying'),
    );
  });

  it('gives up after the configured retries with the last error', async () => {
    const failure = new Error(`auth failed for ${SECRET_URI}`);
    const connect = vi.spyOn(mongoose, 'connect').mockRejectedValue(failure);

    await expect(connectDatabaseWithRetry(buildConfig({ connectRetries: 2 }))).rejects.toBe(
      failure,
    );
    expect(connect).toHaveBeenCalledTimes(3);
    expect(loggedOutput(vi.mocked(logger.warn))).not.toContain('s3cret');
  });

  it('does not retry invalid configuration', async () => {
    const connect = vi.spyOn(mongoose, 'connect');

    await expect(
      connectDatabaseWithRetry(buildConfig({ uri: '', connectRetries: 3 })),
    ).rejects.toBeInstanceOf(DatabaseConfigError);
    expect(connect).not.toHaveBeenCalled();
  });

  it('logs disconnections and connection errors after connecting', async () => {
    vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    await connectDatabase(buildConfig());

    mongoose.connection.emit('disconnected');
    mongoose.connection.emit('error', new Error(`lost ${SECRET_URI}`));

    expect(logger.warn).toHaveBeenCalledWith('MongoDB disconnected');
    expect(logger.error).toHaveBeenCalledWith(
      { err: { name: 'Error', message: 'lost mongodb://***@db.example.com:27017/devflow' } },
      'MongoDB connection error',
    );
  });

  it('skips disconnecting when no connection is open', async () => {
    const disconnect = vi.spyOn(mongoose, 'disconnect');

    await disconnectDatabase();

    expect(disconnect).not.toHaveBeenCalled();
    expect(getDatabaseStatus()).toBe('disconnected');
  });
});
