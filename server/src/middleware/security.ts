import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';

import { env } from '../config/env.js';
import type { ApiErrorResponse } from '../types/api.js';

export const securityHeaders = helmet();

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Requests without an Origin header (same-origin, curl, server-to-server) are allowed.
    callback(null, !origin || env.CLIENT_ORIGIN.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 600,
});

const rateLimitResponse: ApiErrorResponse = {
  success: false,
  error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later' },
};

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: rateLimitResponse,
});
