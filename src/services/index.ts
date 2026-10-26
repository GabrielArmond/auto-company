import type { DriverService } from './driverService';
import type { VehicleService } from './vehicleService';
import type { VehicleUsageService } from './vehicleUsageService';

// Set of services the app receives (built in container.ts or in tests).
export interface Services {
  vehicleService: VehicleService;
  driverService: DriverService;
  vehicleUsageService: VehicleUsageService;
}
