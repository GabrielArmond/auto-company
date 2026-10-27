import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import type { Services } from '../../src/services';
import { createTestApp, TEST_API_KEY } from '../support/createTestApp';

describe('API key authentication', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('rejects requests without the API key with 401', async () => {
    const res = await request(app).get('/api/vehicles');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or missing API key');
  });

  it('rejects requests with a wrong API key with 401', async () => {
    const res = await request(app).get('/api/drivers').set('X-API-Key', `${TEST_API_KEY}x`);

    expect(res.status).toBe(401);
  });

  it.each([
    ['POST', '/api/vehicles'],
    ['PUT', '/api/drivers/1'],
    ['DELETE', '/api/vehicles/1'],
    ['GET', '/api/vehicle-usages'],
    ['PATCH', '/api/vehicle-usages/1/finish'],
  ])('protects %s %s', async (method, path) => {
    const res = await request(app)[method.toLowerCase() as 'get'](path).send({});

    expect(res.status).toBe(401);
  });

  it('accepts requests with a valid API key', async () => {
    const res = await request(app).get('/api/vehicles').set('X-API-Key', TEST_API_KEY);

    expect(res.status).toBe(200);
  });

  it('accepts any of the configured API keys', async () => {
    const otherKey = 'other-api-key-0123456789abcdef012345678';
    const multiKeyApp = createApp({} as Services, { apiKeys: [TEST_API_KEY, otherKey] });

    expect((await request(multiKeyApp).get('/api/health').set('X-API-Key', otherKey)).status).toBe(200);
    expect((await request(multiKeyApp).get('/api/unknown').set('X-API-Key', otherKey)).status).toBe(404);
  });

  it.each(['/api/health', '/api/docs.json', '/api/docs/'])('keeps %s public', async (path) => {
    const res = await request(app).get(path);

    expect(res.status).toBe(200);
  });

  it('refuses to start without API keys', () => {
    expect(() => createApp({} as Services, { apiKeys: [] })).toThrow('Missing API_KEYS environment variable');
  });

  it('refuses to start with a short API key', () => {
    expect(() => createApp({} as Services, { apiKeys: ['short'] })).toThrow('at least 32 characters');
  });
});
