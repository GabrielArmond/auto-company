import { createApp } from '../../src/app';
import type { DriverRepository } from '../../src/repositories/driverRepository';
import type { VehicleRepository } from '../../src/repositories/vehicleRepository';
import type { VehicleUsageRepository } from '../../src/repositories/vehicleUsageRepository';
import { createDriverService } from '../../src/services/driverService';
import { createVehicleService } from '../../src/services/vehicleService';
import { createVehicleUsageService } from '../../src/services/vehicleUsageService';
import { createInMemoryDriverRepository } from './inMemoryDriverRepository';
import { createInMemoryVehicleRepository } from './inMemoryVehicleRepository';
import { createInMemoryVehicleUsageRepository } from './inMemoryVehicleUsageRepository';

interface TestRepositories {
  vehicleRepository?: VehicleRepository;
  driverRepository?: DriverRepository;
  vehicleUsageRepository?: VehicleUsageRepository;
}

// Builds the app with in-memory repositories; pass only the ones a test needs to seed.
export function createTestApp({
  vehicleRepository = createInMemoryVehicleRepository(),
  driverRepository = createInMemoryDriverRepository(),
  vehicleUsageRepository = createInMemoryVehicleUsageRepository(),
}: TestRepositories = {}) {
  return createApp({
    vehicleService: createVehicleService(vehicleRepository, vehicleUsageRepository),
    driverService: createDriverService(driverRepository, vehicleUsageRepository),
    vehicleUsageService: createVehicleUsageService({ vehicleUsageRepository, vehicleRepository, driverRepository }),
  });
}
