import request from 'supertest';
import { createApp } from '../../src/app';
import { createServices } from '../../src/container';
import { createInMemoryDriverRepository } from '../../src/repositories/memory/driverRepository';
import { createInMemoryVehicleRepository } from '../../src/repositories/memory/vehicleRepository';
import { createInMemoryVehicleUsageRepository } from '../../src/repositories/memory/vehicleUsageRepository';
import { TEST_API_KEY } from '../support/createTestApp';

function createLimitedApp(trustProxy = 0) {
  const services = createServices({
    vehicleRepository: createInMemoryVehicleRepository(),
    driverRepository: createInMemoryDriverRepository(),
    vehicleUsageRepository: createInMemoryVehicleUsageRepository(),
  });
  return createApp(services, { apiKeys: [TEST_API_KEY], rateLimit: { windowMs: 60_000, limit: 2 }, trustProxy });
}

describe('rate limiting', () => {
  it('returns 429 after the limit, with the standard headers', async () => {
    const api = request.agent(createLimitedApp()).set('X-API-Key', TEST_API_KEY);

    const first = await api.get('/api/vehicles');
    expect(first.status).toBe(200);
    expect(first.headers.ratelimit).toMatch(/r=1/);
    expect(first.headers['ratelimit-policy']).toMatch(/q=2; w=60/);

    await api.get('/api/vehicles');
    const blocked = await api.get('/api/drivers');

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: 'Too many requests, please try again later' });
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('also counts requests without a valid API key, which limits key guessing', async () => {
    const app = createLimitedApp();

    await request(app).get('/api/vehicles').set('X-API-Key', 'wrong');
    await request(app).get('/api/vehicles').set('X-API-Key', 'wrong');
    const res = await request(app).get('/api/vehicles').set('X-API-Key', TEST_API_KEY);

    expect(res.status).toBe(429);
  });

  it('keeps /api/health and the docs out of the limit', async () => {
    const app = createLimitedApp();

    for (let i = 0; i < 3; i++) {
      expect((await request(app).get('/api/health')).status).toBe(200);
      expect((await request(app).get('/api/docs.json')).status).toBe(200);
    }
  });

  it('ignores X-Forwarded-For when no proxy is trusted', async () => {
    const api = request.agent(createLimitedApp()).set('X-API-Key', TEST_API_KEY);

    await api.get('/api/vehicles').set('X-Forwarded-For', '10.0.0.1');
    await api.get('/api/vehicles').set('X-Forwarded-For', '10.0.0.2');
    const res = await api.get('/api/vehicles').set('X-Forwarded-For', '10.0.0.3');

    expect(res.status).toBe(429);
  });

  it('limits each client separately behind a trusted proxy', async () => {
    const api = request.agent(createLimitedApp(1)).set('X-API-Key', TEST_API_KEY);

    await api.get('/api/vehicles').set('X-Forwarded-For', '10.0.0.1');
    await api.get('/api/vehicles').set('X-Forwarded-For', '10.0.0.1');

    expect((await api.get('/api/vehicles').set('X-Forwarded-For', '10.0.0.1')).status).toBe(429);
    expect((await api.get('/api/vehicles').set('X-Forwarded-For', '10.0.0.2')).status).toBe(200);
  });
});
