import type { DriverRepository } from '../repositories/driverRepository';
import type { VehicleRepository } from '../repositories/vehicleRepository';
import type { VehicleUsageRepository } from '../repositories/vehicleUsageRepository';
import { HttpError } from '../utils/HttpError';
import { isValidId } from '../utils/isValidId';
import { validateUsageFinish, validateUsageStart } from '../validators/vehicleUsageValidator';

export type VehicleUsageService = ReturnType<typeof createVehicleUsageService>;

interface Dependencies {
  vehicleUsageRepository: VehicleUsageRepository;
  vehicleRepository: VehicleRepository;
  driverRepository: DriverRepository;
  now?: () => Date;
}

export function createVehicleUsageService({
  vehicleUsageRepository,
  vehicleRepository,
  driverRepository,
  now = () => new Date(),
}: Dependencies) {
  async function getById(id: string) {
    const usage = isValidId(id) ? await vehicleUsageRepository.findById(id) : null;
    if (!usage) throw HttpError.notFound('Vehicle usage not found');
    return usage;
  }

  return {
    getById,

    list() {
      return vehicleUsageRepository.list();
    },

    async start(body: unknown) {
      const { driverId, vehicleId, reason, startDate } = validateUsageStart(body, now());

      const [vehicle, driver] = await Promise.all([
        vehicleRepository.findById(vehicleId),
        driverRepository.findById(driverId),
      ]);
      if (!vehicle) throw HttpError.notFound('Vehicle not found');
      if (!driver) throw HttpError.notFound('Driver not found');

      const [vehicleUsage, driverUsage] = await Promise.all([
        vehicleUsageRepository.findActiveByVehicle(vehicle.id),
        vehicleUsageRepository.findActiveByDriver(driver.id),
      ]);
      if (vehicleUsage) {
        throw HttpError.conflict(`Vehicle ${vehicle.plate} is already in use by ${vehicleUsage.driver.name}`);
      }
      if (driverUsage) {
        throw HttpError.conflict(`Driver ${driver.name} is already using vehicle ${driverUsage.vehicle.plate}`);
      }

      return vehicleUsageRepository.create({
        driver: { id: driver.id, name: driver.name },
        vehicle: { id: vehicle.id, plate: vehicle.plate, color: vehicle.color, brand: vehicle.brand },
        reason,
        startDate,
      });
    },

    async finish(id: string, body: unknown) {
      const usage = await getById(id);
      if (usage.endDate) throw HttpError.conflict('Vehicle usage is already finished');

      const endDate = validateUsageFinish(body, new Date(usage.startDate), now());
      return vehicleUsageRepository.finish(id, endDate);
    },
  };
}
