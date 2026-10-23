import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { jsonResponse } from '@/test/render';

import { ApiError, apiClient } from './api-client';

const itemSchema = z.object({ id: z.string(), name: z.string() });

function mockFetch(implementation: () => Promise<Response>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(implementation);
}

describe('apiClient', () => {
  it('unwraps and validates the success envelope', async () => {
    const fetchSpy = mockFetch(() =>
      Promise.resolve(jsonResponse({ success: true, data: { id: '1', name: 'Board' } })),
    );

    await expect(apiClient.get('/items/1', itemSchema)).resolves.toEqual({
      id: '1',
      name: 'Board',
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/items/1',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
  });

  it('serializes JSON bodies', async () => {
    const fetchSpy = mockFetch(() =>
      Promise.resolve(
        jsonResponse({ success: true, data: { id: '2', name: 'New' } }, { status: 201 }),
      ),
    );

    await apiClient.post('/items', itemSchema, { name: 'New' });

    const [, init] = fetchSpy.mock.calls[0] ?? [];
    expect(init?.body).toBe(JSON.stringify({ name: 'New' }));
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
  });

  it('maps API error envelopes to ApiError', async () => {
    mockFetch(() =>
      Promise.resolve(
        jsonResponse(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Item not found', requestId: 'req-1' },
          },
          { status: 404 },
        ),
      ),
    );

    const error = await apiClient.get('/items/9', itemSchema).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Item not found',
      requestId: 'req-1',
    });
  });

  it('reports network failures with status 0', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));

    const error = await apiClient.get('/items', itemSchema).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetworkError).toBe(true);
  });

  it('rejects responses that do not match the schema', async () => {
    mockFetch(() => Promise.resolve(jsonResponse({ success: true, data: { id: 1 } })));

    await expect(apiClient.get('/items/1', itemSchema)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('handles non-JSON error responses', async () => {
    mockFetch(() => Promise.resolve(new Response('Bad Gateway', { status: 502 })));

    await expect(apiClient.get('/items', itemSchema)).rejects.toMatchObject({
      status: 502,
      code: 'HTTP_ERROR',
    });
  });
});
