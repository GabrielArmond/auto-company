import request from 'supertest';
import { createApp } from '../../src/app';
import { createServices, type Repositories } from '../../src/container';
import { API_KEY_HEADER } from '../../src/middlewares/requireApiKey';
import { createInMemoryDriverRepository } from '../../src/repositories/memory/driverRepository';
import { createInMemoryVehicleRepository } from '../../src/repositories/memory/vehicleRepository';
import { createInMemoryVehicleUsageRepository } from '../../src/repositories/memory/vehicleUsageRepository';

export const TEST_API_KEY = 'test-api-key-0123456789abcdef0123456789';

type TestRepositories = Partial<Repositories>;

export type TestClient = ReturnType<typeof createTestClient>;

// Builds the app with in-memory repositories; pass only the ones a test needs to seed.
export function createTestApp({
  vehicleRepository = createInMemoryVehicleRepository(),
  driverRepository = createInMemoryDriverRepository(),
  vehicleUsageRepository = createInMemoryVehicleUsageRepository(),
}: TestRepositories = {}) {
  return createApp(createServices({ vehicleRepository, driverRepository, vehicleUsageRepository }), {
    apiKeys: [TEST_API_KEY],
  });
}

// Supertest client that sends the test API key on every request.
export function createTestClient(repositories?: TestRepositories) {
  return request.agent(createTestApp(repositories)).set(API_KEY_HEADER, TEST_API_KEY);
}
