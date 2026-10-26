import { connectFirestore } from './config/firebase';
import { createFirestoreDriverRepository } from './repositories/firestore/driverRepository';
import { createFirestoreVehicleRepository } from './repositories/firestore/vehicleRepository';
import type { Services } from './services';
import { createDriverService } from './services/driverService';
import { createVehicleService } from './services/vehicleService';

// Wires the real dependencies (Firestore). In tests, the app receives in-memory repositories.
export async function createContainer(): Promise<Services> {
  const db = await connectFirestore();

  const vehicleRepository = createFirestoreVehicleRepository(db);
  const driverRepository = createFirestoreDriverRepository(db);

  return {
    vehicleService: createVehicleService(vehicleRepository),
    driverService: createDriverService(driverRepository),
  };
}
