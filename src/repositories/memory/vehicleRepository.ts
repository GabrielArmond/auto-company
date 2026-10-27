import type { Vehicle, VehicleInput } from '../../models/vehicle';
import type { VehicleRepository } from '../vehicleRepository';
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
      return save(String(nextId++), data);
    },

    async update(id, data) {
      return save(id, data, docs.get(id)?.createdAt);
    },

    async delete(id) {
      docs.delete(id);
    },
  };
}
