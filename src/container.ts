import { config } from './config';
import { connectFirestore } from './config/firebase';
import type { DriverRepository } from './repositories/driverRepository';
import { createFirestoreDriverRepository } from './repositories/firestore/driverRepository';
import { createFirestoreVehicleRepository } from './repositories/firestore/vehicleRepository';
import { createFirestoreVehicleUsageRepository } from './repositories/firestore/vehicleUsageRepository';
import { createInMemoryDriverRepository } from './repositories/memory/driverRepository';
import { createInMemoryVehicleRepository } from './repositories/memory/vehicleRepository';
import { createInMemoryVehicleUsageRepository } from './repositories/memory/vehicleUsageRepository';
import type { VehicleRepository } from './repositories/vehicleRepository';
import type { VehicleUsageRepository } from './repositories/vehicleUsageRepository';
import type { Services } from './services';
import { createDriverService } from './services/driverService';
import { createVehicleService } from './services/vehicleService';
import { createVehicleUsageService } from './services/vehicleUsageService';

export const DATABASES = ['memory', 'firestore'] as const;

export interface Repositories {
  vehicleRepository: VehicleRepository;
  driverRepository: DriverRepository;
  vehicleUsageRepository: VehicleUsageRepository;
}

export function createServices({ vehicleRepository, driverRepository, vehicleUsageRepository }: Repositories): Services {
  return {
    vehicleService: createVehicleService(vehicleRepository, vehicleUsageRepository),
    driverService: createDriverService(driverRepository, vehicleUsageRepository),
    vehicleUsageService: createVehicleUsageService({ vehicleUsageRepository, vehicleRepository, driverRepository }),
  };
}

async function createRepositories(database: string): Promise<Repositories> {
  if (database === 'memory') {
    return {
      vehicleRepository: createInMemoryVehicleRepository(),
      driverRepository: createInMemoryDriverRepository(),
      vehicleUsageRepository: createInMemoryVehicleUsageRepository(),
    };
  }

  if (database === 'firestore') {
    const db = await connectFirestore();
    return {
      vehicleRepository: createFirestoreVehicleRepository(db),
      driverRepository: createFirestoreDriverRepository(db),
      vehicleUsageRepository: createFirestoreVehicleUsageRepository(db),
    };
  }

  throw new Error(`Invalid DATABASE "${database}". Use one of: ${DATABASES.join(', ')}`);
}

// Wires the repositories chosen by DATABASE to the services.
export async function createContainer(database = config.database): Promise<Services> {
  return createServices(await createRepositories(database));
}
