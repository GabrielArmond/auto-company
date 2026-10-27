import request from 'supertest';
import { createApp } from '../../src/app';
import { API_KEY_HEADER } from '../../src/middlewares/requireApiKey';
import type { DriverRepository } from '../../src/repositories/driverRepository';
import type { VehicleRepository } from '../../src/repositories/vehicleRepository';
import type { VehicleUsageRepository } from '../../src/repositories/vehicleUsageRepository';
import { createDriverService } from '../../src/services/driverService';
import { createVehicleService } from '../../src/services/vehicleService';
import { createVehicleUsageService } from '../../src/services/vehicleUsageService';
import { createInMemoryDriverRepository } from './inMemoryDriverRepository';
import { createInMemoryVehicleRepository } from './inMemoryVehicleRepository';
import { createInMemoryVehicleUsageRepository } from './inMemoryVehicleUsageRepository';

export const TEST_API_KEY = 'test-api-key-0123456789abcdef0123456789';

interface TestRepositories {
  vehicleRepository?: VehicleRepository;
  driverRepository?: DriverRepository;
  vehicleUsageRepository?: VehicleUsageRepository;
}

export type TestClient = ReturnType<typeof createTestClient>;

// Builds the app with in-memory repositories; pass only the ones a test needs to seed.
export function createTestApp({
  vehicleRepository = createInMemoryVehicleRepository(),
  driverRepository = createInMemoryDriverRepository(),
  vehicleUsageRepository = createInMemoryVehicleUsageRepository(),
}: TestRepositories = {}) {
  return createApp(
    {
      vehicleService: createVehicleService(vehicleRepository, vehicleUsageRepository),
      driverService: createDriverService(driverRepository, vehicleUsageRepository),
      vehicleUsageService: createVehicleUsageService({ vehicleUsageRepository, vehicleRepository, driverRepository }),
    },
    { apiKeys: [TEST_API_KEY] },
  );
}

// Supertest client that sends the test API key on every request.
export function createTestClient(repositories?: TestRepositories) {
  return request.agent(createTestApp(repositories)).set(API_KEY_HEADER, TEST_API_KEY);
}
