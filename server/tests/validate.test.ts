import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { errorHandler } from '../src/middleware/error-handler.js';
import { requestLogger } from '../src/middleware/request-logger.js';
import { validate } from '../src/middleware/validate.js';
import { AppError } from '../src/utils/app-error.js';

function buildApp() {
  const app = express();
  app.use(requestLogger);
  app.use(express.json());

  app.post(
    '/items/:id',
    validate({
      params: z.object({ id: z.string().regex(/^\d+$/) }),
      body: z.object({ name: z.string().min(1), quantity: z.coerce.number().int().positive() }),
    }),
    (req, res) => {
      res.json(req.validated);
    },
  );

  app.get('/boom', () => {
    throw new Error('database password leaked');
  });

  app.get('/conflict', () => {
    throw new AppError(409, 'Project name already taken');
  });

  app.use(errorHandler);
  return app;
}

describe('validate middleware', () => {
  const app = buildApp();

  it('passes parsed and coerced values to the handler', async () => {
    const res = await request(app).post('/items/42').send({ name: 'Board', quantity: '3' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ params: { id: '42' }, body: { name: 'Board', quantity: 3 } });
  });

  it('reports every invalid field with its location', async () => {
    const res = await request(app).post('/items/abc').send({ name: '', quantity: -1 });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const locations = (res.body.error.details as { location: string; path: string }[]).map(
      ({ location, path }) => `${location}.${path}`,
    );
    expect(locations).toEqual(['params.id', 'body.name', 'body.quantity']);
  });
});

describe('error handler', () => {
  const app = buildApp();

  it('maps AppError to its status code and message', async () => {
    const res = await request(app).get('/conflict');

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'CONFLICT',
      message: 'Project name already taken',
    });
  });

  it('converts unknown errors into a 500 response', async () => {
    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
