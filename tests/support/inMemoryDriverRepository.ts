import type { Driver, DriverInput } from '../../src/models/driver';
import type { DriverRepository } from '../../src/repositories/driverRepository';
import { matchesNameQuery } from '../../src/utils/nameSearch';

type Seed = DriverInput & { id?: string };

// Implements the same contract as the Firestore repository, but in memory.
export function createInMemoryDriverRepository(seed: Seed[] = []): DriverRepository {
  const docs = new Map<string, Driver>();
  let nextId = 1;

  function save(id: string, data: DriverInput, createdAt?: string): Driver {
    const now = new Date().toISOString();
    const driver = { id, ...data, createdAt: createdAt ?? now, updatedAt: now };
    docs.set(id, driver);
    return driver;
  }

  for (const { id, ...data } of seed) save(id ?? String(nextId++), data);

  return {
    async list({ name } = {}) {
      return [...docs.values()].filter((d) => !name || matchesNameQuery(d.name, name));
    },

    async findById(id) {
      return docs.get(id) ?? null;
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
