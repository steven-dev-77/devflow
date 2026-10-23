import type { ErrorCode } from '../utils/app-error.js';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    requestId?: string;
    details?: unknown;
    stack?: string;
  };
}
