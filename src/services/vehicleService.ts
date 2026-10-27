import type { VehicleFilters } from '../models/vehicle';
import type { VehicleRepository } from '../repositories/vehicleRepository';
import type { VehicleUsageRepository } from '../repositories/vehicleUsageRepository';
import { HttpError } from '../utils/HttpError';
import { isValidId } from '../utils/isValidId';
import { parsePagination, type PaginationQuery } from '../validators/paginationValidator';
import { normalizePlate, validateVehicle } from '../validators/vehicleValidator';

export type VehicleService = ReturnType<typeof createVehicleService>;

export function createVehicleService(
  vehicleRepository: VehicleRepository,
  vehicleUsageRepository: VehicleUsageRepository,
) {
  async function getById(id: string) {
    const vehicle = isValidId(id) ? await vehicleRepository.findById(id) : null;
    if (!vehicle) throw HttpError.notFound('Vehicle not found');
    return vehicle;
  }

  async function getByLicensePlate(plate: string) {
    const vehicle = await vehicleRepository.findByPlate(normalizePlate(plate) as string);
    if (!vehicle) throw HttpError.notFound('Vehicle not found');
    return vehicle;
  }

  async function ensurePlateAvailable(plate: string, currentId?: string) {
    const existing = await vehicleRepository.findByPlate(plate);
    if (existing && existing.id !== currentId) {
      throw HttpError.conflict(`A vehicle with plate ${plate} already exists`);
    }
  }

  return {
    getById,
    getByLicensePlate,

    list({ color, brand }: VehicleFilters = {}, pagination: PaginationQuery = {}) {
      const filters: VehicleFilters = {};
      if (color?.trim()) filters.color = color.trim();
      if (brand?.trim()) filters.brand = brand.trim();

      return vehicleRepository.list(filters, parsePagination(pagination));
    },

    async create(body: unknown) {
      const data = validateVehicle(body);
      await ensurePlateAvailable(data.plate);
      return vehicleRepository.create(data);
    },

    async update(id: string, body: unknown) {
      await getById(id);
      const data = validateVehicle(body);
      await ensurePlateAvailable(data.plate, id);
      return vehicleRepository.update(id, data);
    },

    async remove(id: string) {
      await getById(id);
      if (await vehicleUsageRepository.findActiveByVehicle(id)) {
        throw HttpError.conflict('Vehicle is in use and cannot be deleted');
      }
      await vehicleRepository.delete(id);
    },
  };
}
