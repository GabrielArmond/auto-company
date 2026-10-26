import type { VehicleService } from './vehicleService';

// Set of services the app receives (built in container.ts or in tests).
export interface Services {
  vehicleService: VehicleService;
}
