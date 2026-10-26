import request from 'supertest';
import type { Express } from 'express';
import { createTestApp } from '../support/createTestApp';

describe('API docs', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('GET /api/docs.json returns the OpenAPI document', async () => {
    const res = await request(app).get('/api/docs.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining([
        '/health',
        '/vehicles',
        '/vehicles/{id}',
        '/drivers',
        '/drivers/{id}',
        '/vehicle-usages',
        '/vehicle-usages/{id}',
        '/vehicle-usages/{id}/finish',
      ]),
    );
  });

  it('GET /api/docs/ serves the Swagger UI', async () => {
    const res = await request(app).get('/api/docs/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('swagger-ui');
  });
});
