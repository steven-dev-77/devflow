import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { isProduction } from '../config/env.js';
import type { ApiErrorResponse } from '../types/api.js';
import { AppError } from '../utils/app-error.js';

/** Shape of errors raised by Express' built-in body parsers. */
interface HttpParserError extends Error {
  status: number;
  type: string;
}

function isHttpParserError(error: unknown): error is HttpParserError {
  return (
    error instanceof Error &&
    typeof (error as Partial<HttpParserError>).status === 'number' &&
    typeof (error as Partial<HttpParserError>).type === 'string'
  );
}

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return AppError.validation(
      error.issues.map(({ path, message, code }) => ({ path: path.join('.'), message, code })),
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return AppError.validation(
      Object.values(error.errors).map(({ path, message }) => ({ path, message })),
    );
  }

  if (error instanceof mongoose.Error.CastError) {
    return AppError.badRequest(`Invalid value for "${error.path}"`);
  }

  if (isHttpParserError(error) && error.status >= 400 && error.status < 500) {
    const message =
      error.type === 'entity.parse.failed' ? 'Malformed JSON in request body' : error.message;
    return new AppError(error.status, message, { cause: error });
  }

  return new AppError(500, 'An unexpected error occurred', {
    code: 'INTERNAL_SERVER_ERROR',
    cause: error,
    isOperational: false,
  });
}

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const appError = normalizeError(error);

  if (appError.isOperational) {
    req.log.warn({ err: appError }, appError.message);
  } else {
    req.log.error({ err: error as unknown }, 'Unhandled error');
  }

  const exposeInternals = !isProduction && !appError.isOperational && error instanceof Error;

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      // Internal error messages are never sent to clients in production.
      message: appError.isOperational || !isProduction ? appError.message : 'Internal server error',
      ...(typeof req.id === 'string' ? { requestId: req.id } : {}),
      ...(appError.details === undefined ? {} : { details: appError.details }),
      ...(exposeInternals && error.stack ? { stack: error.stack } : {}),
    },
  };

  res.status(appError.statusCode).json(body);
};
