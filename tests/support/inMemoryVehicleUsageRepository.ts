import type { VehicleUsage, VehicleUsageInput } from '../../src/models/vehicleUsage';
import type { VehicleUsageRepository } from '../../src/repositories/vehicleUsageRepository';

type Seed = VehicleUsageInput & { id?: string; endDate?: Date | null };

export function createInMemoryVehicleUsageRepository(seed: Seed[] = []): VehicleUsageRepository {
  const docs = new Map<string, VehicleUsage>();
  let nextId = 1;

  function insert({ id, endDate = null, startDate, ...data }: Seed): VehicleUsage {
    const now = new Date().toISOString();
    const usage: VehicleUsage = {
      id: id ?? String(nextId++),
      ...data,
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString() ?? null,
      createdAt: now,
      updatedAt: now,
    };
    docs.set(usage.id, usage);
    return usage;
  }

  const findActive = (predicate: (usage: VehicleUsage) => boolean) =>
    [...docs.values()].find((usage) => !usage.endDate && predicate(usage)) ?? null;

  for (const usage of seed) insert(usage);

  return {
    async list() {
      return [...docs.values()].sort((a, b) => b.startDate.localeCompare(a.startDate));
    },

    async findById(id) {
      return docs.get(id) ?? null;
    },

    async findActiveByVehicle(vehicleId) {
      return findActive((usage) => usage.vehicle.id === vehicleId);
    },

    async findActiveByDriver(driverId) {
      return findActive((usage) => usage.driver.id === driverId);
    },

    async create(data) {
      return insert(data);
    },

    async finish(id, endDate) {
      const usage = { ...docs.get(id)!, endDate: endDate.toISOString(), updatedAt: new Date().toISOString() };
      docs.set(id, usage);
      return usage;
    },
  };
}
