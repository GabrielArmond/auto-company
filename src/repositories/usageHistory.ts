import type { VehicleUsageInput } from '../models/vehicleUsage';
import { HttpError } from '../utils/HttpError';

export interface LastEndDates {
  vehicle: Date | null;
  driver: Date | null;
}

export function ensureStartsAfterHistory({ vehicle, driver, startDate }: VehicleUsageInput, lastEnd: LastEndDates) {
  if (lastEnd.vehicle && startDate < lastEnd.vehicle) {
    throw HttpError.conflict(
      `Vehicle ${vehicle.plate} was in use until ${lastEnd.vehicle.toISOString()}; the usage cannot start before that`,
    );
  }
  if (lastEnd.driver && startDate < lastEnd.driver) {
    throw HttpError.conflict(
      `Driver ${driver.name} was using a vehicle until ${lastEnd.driver.toISOString()}; the usage cannot start before that`,
    );
  }
}
