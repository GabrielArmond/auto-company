import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
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
  const drivers = collection(db, COLLECTION);

  return {
    async list({ name } = {}) {
      const terms = toSearchWords(name ?? '');
      if (!terms.length) return (await getDocs(drivers)).docs.map(toDriver);

      const longest = terms.reduce((a, b) => (b.length > a.length ? b : a));
      const snapshot = await getDocs(query(drivers, where('nameSearch', 'array-contains', longest)));

      return snapshot.docs.map(toDriver).filter((driver) => matchesNameQuery(driver.name, name ?? ''));
    },

    async findById(id) {
      const snapshot = await getDoc(doc(drivers, id));
      return snapshot.exists() ? toDriver(snapshot) : null;
    },

    async create(data) {
      const now = new Date();
      const ref = await addDoc(drivers, { ...toDocument(data), createdAt: now, updatedAt: now });
      return toDriver(await getDoc(ref));
    },

    async update(id, data) {
      const ref = doc(drivers, id);
      await updateDoc(ref, { ...toDocument(data), updatedAt: new Date() });
      return toDriver(await getDoc(ref));
    },

    async delete(id) {
      await deleteDoc(doc(drivers, id));
    },
  };
}
