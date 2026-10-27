import type { DocumentSnapshot, Firestore } from 'firebase-admin/firestore';
import type { Driver, DriverInput } from '../../models/driver';
import { buildPrefixIndex, matchesNameQuery, toSearchWords } from '../../utils/nameSearch';
import type { DriverRepository } from '../driverRepository';
import { toEntity } from './toEntity';

const COLLECTION = 'drivers';

// Search-only field; never exposed by the API.
interface SearchFields {
  nameSearch: string[];
}

function toDocument(data: DriverInput): DriverInput & SearchFields {
  return { ...data, nameSearch: buildPrefixIndex(data.name) };
}

function toDriver(snapshot: DocumentSnapshot): Driver {
  const { nameSearch, ...driver } = toEntity<Driver & SearchFields>(snapshot);
  return driver;
}

export function createFirestoreDriverRepository(db: Firestore): DriverRepository {
  const drivers = db.collection(COLLECTION);

  return {
    async list({ name } = {}) {
      const terms = toSearchWords(name ?? '');
      if (!terms.length) return (await drivers.get()).docs.map(toDriver);

      const longest = terms.reduce((a, b) => (b.length > a.length ? b : a));
      const snapshot = await drivers.where('nameSearch', 'array-contains', longest).get();

      return snapshot.docs.map(toDriver).filter((driver) => matchesNameQuery(driver.name, name ?? ''));
    },

    async findById(id) {
      const snapshot = await drivers.doc(id).get();
      return snapshot.exists ? toDriver(snapshot) : null;
    },

    async create(data) {
      const now = new Date();
      const ref = await drivers.add({ ...toDocument(data), createdAt: now, updatedAt: now });
      return toDriver(await ref.get());
    },

    async update(id, data) {
      const ref = drivers.doc(id);
      await ref.update({ ...toDocument(data), updatedAt: new Date() });
      return toDriver(await ref.get());
    },

    async delete(id) {
      await drivers.doc(id).delete();
    },
  };
}
