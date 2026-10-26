import { createApp } from '../../src/app';
import type { DriverRepository } from '../../src/repositories/driverRepository';
import type { VehicleRepository } from '../../src/repositories/vehicleRepository';
import { createDriverService } from '../../src/services/driverService';
import { createVehicleService } from '../../src/services/vehicleService';
import { createInMemoryDriverRepository } from './inMemoryDriverRepository';
import { createInMemoryVehicleRepository } from './inMemoryVehicleRepository';

interface TestRepositories {
  vehicleRepository?: VehicleRepository;
  driverRepository?: DriverRepository;
}

// Builds the app with in-memory repositories; pass only the ones a test needs to seed.
export function createTestApp({
  vehicleRepository = createInMemoryVehicleRepository(),
  driverRepository = createInMemoryDriverRepository(),
}: TestRepositories = {}) {
  return createApp({
    vehicleService: createVehicleService(vehicleRepository),
    driverService: createDriverService(driverRepository),
  });
}
