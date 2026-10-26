import type { DriverFilters } from '../models/driver';
import type { DriverRepository } from '../repositories/driverRepository';
import { HttpError } from '../utils/HttpError';
import { validateDriver } from '../validators/driverValidator';

export type DriverService = ReturnType<typeof createDriverService>;

export function createDriverService(driverRepository: DriverRepository) {
  async function getById(id: string) {
    const driver = await driverRepository.findById(id);
    if (!driver) throw HttpError.notFound('Driver not found');
    return driver;
  }

  return {
    getById,

    list({ name }: DriverFilters = {}) {
      const filters: DriverFilters = {};
      if (name?.trim()) filters.name = name.trim();

      return driverRepository.list(filters);
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
      await driverRepository.delete(id);
    },
  };
}
