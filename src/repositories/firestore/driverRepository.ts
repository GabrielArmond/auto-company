import { FieldPath, type DocumentSnapshot, type Firestore, type Query } from 'firebase-admin/firestore';
import type { Driver, DriverInput } from '../../models/driver';
import { buildPrefixIndex, matchesNameQuery, toSearchWords } from '../../utils/nameSearch';
import { toPage } from '../../utils/pagination';
import type { DriverRepository } from '../driverRepository';
import { toEntity } from './toEntity';

const COLLECTION = 'drivers';

// Search-only field; never exposed by the API.
interface SearchFields {
  nameSearch: string[];
}

// Builds the stored document from the input, adding the name prefixes used by the name filter:
// { name: 'Ana Lima' } -> { name: 'Ana Lima', nameSearch: ['a', 'an', 'ana', 'l', 'li', 'lim', 'lima'] }.
function toDocument(data: DriverInput): DriverInput & SearchFields {
  return { ...data, nameSearch: buildPrefixIndex(data.name) };
}

// Parses a stored document back into a Driver, removing the search-only field.
function toDriver(snapshot: DocumentSnapshot): Driver {
  const { nameSearch, ...driver } = toEntity<Driver & SearchFields>(snapshot);
  return driver;
}

export function createFirestoreDriverRepository(db: Firestore): DriverRepository {
  const drivers = db.collection(COLLECTION);

  return {
    async list({ name = '' }, { limit, cursor }) {
      const terms = toSearchWords(name);
      let query: Query = drivers.orderBy(FieldPath.documentId());

      if (!terms.length) {
        if (cursor) query = query.startAfter(cursor);
        return toPage((await query.limit(limit + 1).get()).docs.map(toDriver), limit);
      }

      const longest = terms.reduce((a, b) => (b.length > a.length ? b : a));
      query = query.where('nameSearch', 'array-contains', longest);

      const matches: Driver[] = [];
      let after = cursor;
      while (matches.length <= limit) {
        const batch = await (after ? query.startAfter(after) : query).limit(limit + 1).get();
        matches.push(...batch.docs.map(toDriver).filter((driver) => matchesNameQuery(driver.name, name)));

        if (batch.size <= limit) break;
        after = batch.docs[batch.size - 1].id;
      }

      return toPage(matches, limit);
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
