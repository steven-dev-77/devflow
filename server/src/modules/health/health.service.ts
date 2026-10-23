import { getDatabaseStatus, type DatabaseStatus } from '../../config/database.js';
import { env } from '../../config/env.js';

export interface HealthReport {
  status: 'ok' | 'degraded';
  environment: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  services: {
    database: DatabaseStatus;
  };
}

const APP_VERSION = process.env.npm_package_version ?? 'unknown';

export function getHealthReport(): HealthReport {
  const database = getDatabaseStatus();

  return {
    status: database === 'connected' ? 'ok' : 'degraded',
    environment: env.NODE_ENV,
    version: APP_VERSION,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    services: { database },
  };
}
