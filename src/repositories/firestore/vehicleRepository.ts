import type { DocumentSnapshot, Firestore, Query } from 'firebase-admin/firestore';
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
  const vehicles = db.collection(COLLECTION);

  return {
    async list({ color, brand } = {}) {
      let query: Query = vehicles;
      if (color) query = query.where('colorLower', '==', normalizeSearchTerm(color));
      if (brand) query = query.where('brandLower', '==', normalizeSearchTerm(brand));

      const snapshot = await query.get();
      return snapshot.docs.map(toVehicle);
    },

    async findById(id) {
      const snapshot = await vehicles.doc(id).get();
      return snapshot.exists ? toVehicle(snapshot) : null;
    },

    async findByPlate(plate) {
      const snapshot = await vehicles.where('plate', '==', plate).limit(1).get();
      const found = snapshot.docs[0];
      return found ? toVehicle(found) : null;
    },

    async create(data) {
      const now = new Date();
      const ref = await vehicles.add({ ...toDocument(data), createdAt: now, updatedAt: now });
      return toVehicle(await ref.get());
    },

    async update(id, data) {
      const ref = vehicles.doc(id);
      await ref.update({ ...toDocument(data), updatedAt: new Date() });
      return toVehicle(await ref.get());
    },

    async delete(id) {
      await vehicles.doc(id).delete();
    },
  };
}
