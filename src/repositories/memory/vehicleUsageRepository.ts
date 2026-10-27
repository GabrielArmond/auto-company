import type { VehicleUsage, VehicleUsageInput } from '../../models/vehicleUsage';
import { HttpError } from '../../utils/HttpError';
import { compareIds, toPage } from '../../utils/pagination';
import { ensureStartsAfterHistory } from '../usageHistory';
import type { VehicleUsageRepository } from '../vehicleUsageRepository';

type Seed = VehicleUsageInput & { id?: string; endDate?: Date | null };

// Implements the same contract as the Firestore repository, but in memory.
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

  function lastEndDate(predicate: (usage: VehicleUsage) => boolean): Date | null {
    const ends = [...docs.values()].filter((usage) => usage.endDate && predicate(usage)).map((u) => u.endDate!);
    return ends.length ? new Date(ends.sort().at(-1)!) : null;
  }

  for (const usage of seed) insert(usage);

  return {
    async list({ limit, cursor }) {
      const usages = [...docs.values()].sort(
        (a, b) => b.startDate.localeCompare(a.startDate) || compareIds(b, a),
      );

      const start = cursor ? usages.findIndex((usage) => usage.id === cursor) + 1 : 0;
      if (cursor && !start) throw HttpError.badRequest('Invalid cursor');

      return toPage(usages.slice(start), limit);
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
      if (findActive((usage) => usage.vehicle.id === data.vehicle.id)) {
        throw HttpError.conflict(`Vehicle ${data.vehicle.plate} is already in use`);
      }
      if (findActive((usage) => usage.driver.id === data.driver.id)) {
        throw HttpError.conflict(`Driver ${data.driver.name} is already using another vehicle`);
      }
      ensureStartsAfterHistory(data, {
        vehicle: lastEndDate((usage) => usage.vehicle.id === data.vehicle.id),
        driver: lastEndDate((usage) => usage.driver.id === data.driver.id),
      });
      return insert(data);
    },

    async finish(id, endDate) {
      const current = docs.get(id);
      if (!current) throw HttpError.notFound('Vehicle usage not found');
      if (current.endDate) throw HttpError.conflict('Vehicle usage is already finished');

      const usage = { ...current, endDate: endDate.toISOString(), updatedAt: new Date().toISOString() };
      docs.set(id, usage);
      return usage;
    },
  };
}
