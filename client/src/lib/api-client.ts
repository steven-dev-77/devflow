import { z } from 'zod';

import { env } from '@/config/env';

const apiErrorBodySchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.unknown().optional(),
  }),
});

const apiSuccessEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | undefined;
  readonly details: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    options: { requestId?: string | undefined; details?: unknown; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = options.requestId;
    this.details = options.details;
  }

  /** True when the request never reached the API (offline, DNS, CORS, server down). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

function buildUrl(path: string): string {
  return `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * Performs a request against the DevFlow API and validates the `data` payload of the
 * `{ success: true, data }` envelope with the provided Zod schema.
 */
export async function apiRequest<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  { body, headers, ...init }: RequestOptions = {},
): Promise<z.infer<TSchema>> {
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has('Accept')) requestHeaders.set('Accept', 'application/json');
  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      ...init,
      credentials: 'include',
      headers: requestHeaders,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the DevFlow API', { cause: error });
  }

  const payload = await readJson(response);
  const requestId = response.headers.get('x-request-id') ?? undefined;

  if (!response.ok) {
    const parsedError = apiErrorBodySchema.safeParse(payload);
    if (parsedError.success) {
      const { code, message, details } = parsedError.data.error;
      throw new ApiError(response.status, code, message, {
        requestId: parsedError.data.error.requestId ?? requestId,
        details,
      });
    }
    throw new ApiError(
      response.status,
      'HTTP_ERROR',
      `Request failed with status ${response.status}`,
      { requestId },
    );
  }

  const envelope = apiSuccessEnvelopeSchema.safeParse(payload);
  const result = envelope.success ? schema.safeParse(envelope.data.data) : envelope;
  if (!result.success) {
    throw new ApiError(response.status, 'INVALID_RESPONSE', 'Received an unexpected API response', {
      requestId,
      cause: result.error,
    });
  }

  return result.data;
}

export const apiClient = {
  get: <TSchema extends z.ZodType>(path: string, schema: TSchema, options?: RequestOptions) =>
    apiRequest(path, schema, { ...options, method: 'GET' }),
  post: <TSchema extends z.ZodType>(
    path: string,
    schema: TSchema,
    body?: unknown,
    options?: RequestOptions,
  ) => apiRequest(path, schema, { ...options, method: 'POST', body }),
  patch: <TSchema extends z.ZodType>(
    path: string,
    schema: TSchema,
    body?: unknown,
    options?: RequestOptions,
  ) => apiRequest(path, schema, { ...options, method: 'PATCH', body }),
  delete: <TSchema extends z.ZodType>(path: string, schema: TSchema, options?: RequestOptions) =>
    apiRequest(path, schema, { ...options, method: 'DELETE' }),
};
