import type { Automovel, AutomovelInput } from '../../src/models/automovel';
import type { AutomovelRepository } from '../../src/repositories/automovelRepository';

type Seed = AutomovelInput & { id?: string };

// Implementa o mesmo contrato do repositório do Firestore, mas em memória.
export function createInMemoryAutomovelRepository(seed: Seed[] = []): AutomovelRepository {
  const docs = new Map<string, Automovel>();
  let nextId = 1;

  function save(id: string, data: AutomovelInput, createdAt?: string): Automovel {
    const now = new Date().toISOString();
    const automovel = { id, ...data, createdAt: createdAt ?? now, updatedAt: now };
    docs.set(id, automovel);
    return automovel;
  }

  for (const { id, ...data } of seed) save(id ?? String(nextId++), data);

  return {
    async list({ cor, marca } = {}) {
      return [...docs.values()].filter((a) => (!cor || a.cor === cor) && (!marca || a.marca === marca));
    },

    async findById(id) {
      return docs.get(id) ?? null;
    },

    async findByPlaca(placa) {
      return [...docs.values()].find((a) => a.placa === placa) ?? null;
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
