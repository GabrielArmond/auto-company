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
  type DocumentSnapshot,
  type Firestore,
  type QueryConstraint,
} from 'firebase/firestore';
import type { Vehicle, VehicleInput } from '../../models/vehicle';
import { normalizeSearchTerm } from '../../utils/normalizeSearchTerm';
import type { VehicleRepository } from '../vehicleRepository';
import { toEntity } from './toEntity';

const COLLECTION = 'vehicles';

// Lowercase copies used only for case-insensitive filtering; never exposed by the API.
interface SearchFields {
  colorLower: string;
  brandLower: string;
}

function toDocument(data: VehicleInput): VehicleInput & SearchFields {
  return {
    ...data,
    colorLower: normalizeSearchTerm(data.color),
    brandLower: normalizeSearchTerm(data.brand),
  };
}

function toVehicle(snapshot: DocumentSnapshot): Vehicle {
  const { colorLower, brandLower, ...vehicle } = toEntity<Vehicle & SearchFields>(snapshot);
  return vehicle;
}

export function createFirestoreVehicleRepository(db: Firestore): VehicleRepository {
  const vehicles = collection(db, COLLECTION);

  return {
    async list({ color, brand } = {}) {
      const constraints: QueryConstraint[] = [];
      if (color) constraints.push(where('colorLower', '==', normalizeSearchTerm(color)));
      if (brand) constraints.push(where('brandLower', '==', normalizeSearchTerm(brand)));

      const snapshot = await getDocs(query(vehicles, ...constraints));
      return snapshot.docs.map(toVehicle);
    },

    async findById(id) {
      const snapshot = await getDoc(doc(vehicles, id));
      return snapshot.exists() ? toVehicle(snapshot) : null;
    },

    async findByPlate(plate) {
      const snapshot = await getDocs(query(vehicles, where('plate', '==', plate), limit(1)));
      const found = snapshot.docs[0];
      return found ? toVehicle(found) : null;
    },

    async create(data) {
      const now = new Date();
      const ref = await addDoc(vehicles, { ...toDocument(data), createdAt: now, updatedAt: now });
      return toVehicle(await getDoc(ref));
    },

    async update(id, data) {
      const ref = doc(vehicles, id);
      await updateDoc(ref, { ...toDocument(data), updatedAt: new Date() });
      return toVehicle(await getDoc(ref));
    },

    async delete(id) {
      await deleteDoc(doc(vehicles, id));
    },
  };
}
