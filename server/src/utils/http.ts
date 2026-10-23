import type { Response } from 'express';

import type { ApiSuccessResponse } from '../types/api.js';

export function sendSuccess(res: Response, data: unknown, statusCode = 200): void {
  const body: ApiSuccessResponse<unknown> = { success: true, data };
  res.status(statusCode).json(body);
}
