import type { VehicleFilters } from '../models/vehicle';
import type { VehicleRepository } from '../repositories/vehicleRepository';
import { HttpError } from '../utils/HttpError';
import { validateVehicle } from '../validators/vehicleValidator';

export type VehicleService = ReturnType<typeof createVehicleService>;

export function createVehicleService(vehicleRepository: VehicleRepository) {
  async function getById(id: string) {
    const vehicle = await vehicleRepository.findById(id);
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

    list({ color, brand }: VehicleFilters = {}) {
      const filters: VehicleFilters = {};
      if (color?.trim()) filters.color = color.trim();
      if (brand?.trim()) filters.brand = brand.trim();

      return vehicleRepository.list(filters);
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
      await vehicleRepository.delete(id);
    },
  };
}
