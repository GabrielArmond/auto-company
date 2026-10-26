import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  type Firestore,
  type QueryConstraint,
} from 'firebase/firestore';
import type { Vehicle } from '../../models/vehicle';
import type { VehicleRepository } from '../vehicleRepository';
import { toEntity } from './toEntity';

const COLLECTION = 'vehicles';

export function createFirestoreVehicleRepository(db: Firestore): VehicleRepository {
  const vehicles = collection(db, COLLECTION);

  return {
    async list({ color, brand } = {}) {
      const constraints: QueryConstraint[] = [];
      if (color) constraints.push(where('color', '==', color));
      if (brand) constraints.push(where('brand', '==', brand));

      const snapshot = await getDocs(query(vehicles, ...constraints));
      return snapshot.docs.map((d) => toEntity<Vehicle>(d));
    },

    async findById(id) {
      const snapshot = await getDoc(doc(vehicles, id));
      return snapshot.exists() ? toEntity<Vehicle>(snapshot) : null;
    },

    async findByPlate(plate) {
      const snapshot = await getDocs(query(vehicles, where('plate', '==', plate), limit(1)));
      const found = snapshot.docs[0];
      return found ? toEntity<Vehicle>(found) : null;
    },

    async create(data) {
      const now = new Date();
      const ref = await addDoc(vehicles, { ...data, createdAt: now, updatedAt: now });
      return toEntity<Vehicle>(await getDoc(ref));
    },

    async update(id, data) {
      const ref = doc(vehicles, id);
      await updateDoc(ref, { ...data, updatedAt: new Date() });
      return toEntity<Vehicle>(await getDoc(ref));
    },

    async delete(id) {
      await deleteDoc(doc(vehicles, id));
    },
  };
}
