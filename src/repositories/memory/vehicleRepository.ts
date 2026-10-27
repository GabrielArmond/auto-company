import type { Vehicle, VehicleInput } from '../../models/vehicle';
import type { VehicleRepository } from '../vehicleRepository';
import { HttpError } from '../../utils/HttpError';
import { normalizeSearchTerm } from '../../utils/normalizeSearchTerm';
import { compareIds, toPage } from '../../utils/pagination';

type Seed = VehicleInput & { id?: string };

// Implements the same contract as the Firestore repository, but in memory.
export function createInMemoryVehicleRepository(seed: Seed[] = []): VehicleRepository {
  const docs = new Map<string, Vehicle>();
  let nextId = 1;

  function save(id: string, data: VehicleInput, createdAt?: string): Vehicle {
    const now = new Date().toISOString();
    const vehicle = { id, ...data, createdAt: createdAt ?? now, updatedAt: now };
    docs.set(id, vehicle);
    return vehicle;
  }

  function ensurePlateAvailable(plate: string, vehicleId?: string) {
    if ([...docs.values()].some((v) => v.plate === plate && v.id !== vehicleId)) {
      throw HttpError.conflict(`A vehicle with plate ${plate} already exists`);
    }
  }

  for (const { id, ...data } of seed) save(id ?? String(nextId++), data);

  return {
    async list({ color, brand }, { limit, cursor }) {
      const matches = (value: string, filter?: string) =>
        !filter || normalizeSearchTerm(value) === normalizeSearchTerm(filter);

      const vehicles = [...docs.values()]
        .filter((v) => matches(v.color, color) && matches(v.brand, brand))
        .filter((v) => !cursor || v.id > cursor)
        .sort(compareIds);

      return toPage(vehicles, limit);
    },

    async findById(id) {
      return docs.get(id) ?? null;
    },

    async findByPlate(plate) {
      return [...docs.values()].find((v) => v.plate === plate) ?? null;
    },

    async create(data) {
      ensurePlateAvailable(data.plate);
      return save(String(nextId++), data);
    },

    async update(id, data) {
      const current = docs.get(id);
      if (!current) throw HttpError.notFound('Vehicle not found');

      ensurePlateAvailable(data.plate, id);
      return save(id, data, current.createdAt);
    },

    async delete(id) {
      docs.delete(id);
    },
  };
}
