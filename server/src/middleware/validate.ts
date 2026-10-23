import type { RequestHandler } from 'express';
import type { z } from 'zod';

import { AppError } from '../utils/app-error.js';

interface RequestSchemas {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

export interface ValidatedRequest {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

declare module 'express-serve-static-core' {
  interface Request {
    /** Parsed request data, populated by the `validate` middleware. */
    validated?: ValidatedRequest;
  }
}

/**
 * Validates request segments against Zod schemas. Parsed (and coerced) values are exposed on
 * `req.validated`, because `req.query` is a read-only getter in Express 5.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    const validated: ValidatedRequest = {};
    const issues: { location: string; path: string; message: string }[] = [];

    for (const location of ['params', 'query', 'body'] as const) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location]);
      if (result.success) {
        validated[location] = result.data;
      } else {
        issues.push(
          ...result.error.issues.map((issue) => ({
            location,
            path: issue.path.join('.'),
            message: issue.message,
          })),
        );
      }
    }

    if (issues.length > 0) {
      next(AppError.validation(issues));
      return;
    }

    req.validated = validated;
    next();
  };
}
