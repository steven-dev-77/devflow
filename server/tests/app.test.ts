import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { API_PREFIX, createApp } from '../src/app.js';

const app = createApp();

describe('health endpoints', () => {
  it('returns a health report with database status', async () => {
    const res = await request(app).get(`${API_PREFIX}/health`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        status: 'degraded',
        environment: 'test',
        services: { database: 'disconnected' },
      },
    });
    expect(typeof res.body.data.uptimeSeconds).toBe('number');
    expect(Date.parse(res.body.data.timestamp)).not.toBeNaN();
  });

  it('reports liveness independently of the database', async () => {
    const res = await request(app).get(`${API_PREFIX}/health/live`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('fails readiness when the database is unavailable', async () => {
    const res = await request(app).get(`${API_PREFIX}/health/ready`);

    expect(res.status).toBe(503);
    expect(res.body.data.services.database).toBe('disconnected');
  });
});

describe('request handling', () => {
  it('assigns a request id when none is provided', async () => {
    const res = await request(app).get(`${API_PREFIX}/health/live`);

    expect(res.headers['x-request-id']).toMatch(/^[\w-]+$/);
  });

  it('propagates a valid incoming request id', async () => {
    const res = await request(app).get(`${API_PREFIX}/health/live`).set('X-Request-Id', 'abc-123');

    expect(res.headers['x-request-id']).toBe('abc-123');
  });

  it('sets security headers and hides the framework', async () => {
    const res = await request(app).get(`${API_PREFIX}/health/live`);

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('allows configured CORS origins only', async () => {
    const allowed = await request(app)
      .get(`${API_PREFIX}/health/live`)
      .set('Origin', 'http://localhost:5173');
    const blocked = await request(app)
      .get(`${API_PREFIX}/health/live`)
      .set('Origin', 'https://evil.example.com');

    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('error handling', () => {
  it('returns a structured 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route GET /api/v1/does-not-exist not found' },
    });
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('rejects malformed JSON bodies with a 400', async () => {
    const res = await request(app)
      .post(`${API_PREFIX}/health`)
      .set('Content-Type', 'application/json')
      .send('{"invalid":');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Malformed JSON in request body',
    });
  });
});
