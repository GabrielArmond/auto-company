import type { Firestore, Query } from 'firebase-admin/firestore';
import type { Automovel } from '../../models/automovel';
import type { AutomovelRepository } from '../automovelRepository';
import { toEntity } from './toEntity';

const COLLECTION = 'automoveis';

export function createFirestoreAutomovelRepository(db: Firestore): AutomovelRepository {
  const collection = db.collection(COLLECTION);

  return {
    async list({ cor, marca } = {}) {
      let query: Query = collection;
      if (cor) query = query.where('cor', '==', cor);
      if (marca) query = query.where('marca', '==', marca);

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => toEntity<Automovel>(doc));
    },

    async findById(id) {
      const doc = await collection.doc(id).get();
      return doc.exists ? toEntity<Automovel>(doc) : null;
    },

    async findByPlaca(placa) {
      const snapshot = await collection.where('placa', '==', placa).limit(1).get();
      const doc = snapshot.docs[0];
      return doc ? toEntity<Automovel>(doc) : null;
    },

    async create(data) {
      const now = new Date();
      const ref = await collection.add({ ...data, createdAt: now, updatedAt: now });
      return toEntity<Automovel>(await ref.get());
    },

    async update(id, data) {
      const ref = collection.doc(id);
      await ref.update({ ...data, updatedAt: new Date() });
      return toEntity<Automovel>(await ref.get());
    },

    async delete(id) {
      await collection.doc(id).delete();
    },
  };
}
