import compression from 'compression';
import express, { type Express } from 'express';

import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { requestLogger } from './middleware/request-logger.js';
import { apiRateLimiter, corsMiddleware, securityHeaders } from './middleware/security.js';
import { apiRouter } from './routes/index.js';

export const API_PREFIX = '/api/v1';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Trust the first proxy hop (load balancer / reverse proxy) so client IPs are correct.
  app.set('trust proxy', 1);

  app.use(requestLogger);
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  app.use('/api', apiRateLimiter);
  app.use(API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
