import type { DriverFilters } from '../models/driver';
import type { DriverRepository } from '../repositories/driverRepository';
import type { VehicleUsageRepository } from '../repositories/vehicleUsageRepository';
import { HttpError } from '../utils/HttpError';
import { isValidId } from '../utils/isValidId';
import { validateDriver } from '../validators/driverValidator';
import { parsePagination, type PaginationQuery } from '../validators/paginationValidator';

export type DriverService = ReturnType<typeof createDriverService>;

export function createDriverService(
  driverRepository: DriverRepository,
  vehicleUsageRepository: VehicleUsageRepository,
) {
  async function getById(id: string) {
    const driver = isValidId(id) ? await driverRepository.findById(id) : null;
    if (!driver) throw HttpError.notFound('Driver not found');
    return driver;
  }

  return {
    getById,

    list({ name }: DriverFilters = {}, pagination: PaginationQuery = {}) {
      const filters: DriverFilters = {};
      if (name?.trim()) filters.name = name.trim();

      return driverRepository.list(filters, parsePagination(pagination));
    },

    async create(body: unknown) {
      return driverRepository.create(validateDriver(body));
    },

    async update(id: string, body: unknown) {
      await getById(id);
      return driverRepository.update(id, validateDriver(body));
    },

    async remove(id: string) {
      await getById(id);
      if (await vehicleUsageRepository.findActiveByDriver(id)) {
        throw HttpError.conflict('Driver is using a vehicle and cannot be deleted');
      }
      await driverRepository.delete(id);
    },
  };
}
