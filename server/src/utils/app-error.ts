export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE';

export interface AppErrorOptions {
  code?: ErrorCode;
  details?: unknown;
  cause?: unknown;
  /** Operational errors are expected failures whose message is safe to show clients. */
  isOperational?: boolean;
}

const DEFAULT_CODES: Record<number, ErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE',
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details: unknown;
  readonly isOperational: boolean;

  constructor(statusCode: number, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = options.code ?? DEFAULT_CODES[statusCode] ?? 'INTERNAL_SERVER_ERROR';
    this.details = options.details;
    this.isOperational = options.isOperational ?? statusCode < 500;
  }

  static badRequest(message = 'Bad request', details?: unknown): AppError {
    return new AppError(400, message, { details });
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, message);
  }

  static validation(details: unknown, message = 'Request validation failed'): AppError {
    return new AppError(422, message, { code: 'VALIDATION_ERROR', details });
  }
}
