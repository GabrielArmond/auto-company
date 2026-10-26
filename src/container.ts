import { connectFirestore } from './config/firebase';
import { createFirestoreVehicleRepository } from './repositories/firestore/vehicleRepository';
import type { Services } from './services';
import { createVehicleService } from './services/vehicleService';

// Wires the real dependencies (Firestore). In tests, the app receives in-memory repositories.
export async function createContainer(): Promise<Services> {
  const db = await connectFirestore();

  const vehicleRepository = createFirestoreVehicleRepository(db);

  return {
    vehicleService: createVehicleService(vehicleRepository),
  };
}
