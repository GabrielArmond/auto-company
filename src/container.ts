import { getDb } from './config/firebase';
import { createFirestoreVehicleRepository } from './repositories/firestore/vehicleRepository';
import type { Services } from './services';
import { createVehicleService } from './services/vehicleService';

// Wires the real dependencies (Firestore). In tests, the app receives in-memory repositories.
export function createContainer(): Services {
  const db = getDb();

  const vehicleRepository = createFirestoreVehicleRepository(db);

  return {
    vehicleService: createVehicleService(vehicleRepository),
  };
}
