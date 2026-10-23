import type { RequestHandler } from 'express';

import { sendSuccess } from '../../utils/http.js';
import { getHealthReport } from './health.service.js';

/** Full health report. Always 200 so dashboards can display degraded states. */
export const getHealth: RequestHandler = (_req, res) => {
  sendSuccess(res, getHealthReport());
};

/** Liveness probe: the process is up and serving requests. */
export const getLiveness: RequestHandler = (_req, res) => {
  sendSuccess(res, { status: 'ok' });
};

/** Readiness probe: dependencies are available, so the instance can receive traffic. */
export const getReadiness: RequestHandler = (_req, res) => {
  const report = getHealthReport();
  sendSuccess(res, report, report.status === 'ok' ? 200 : 503);
};
