import {
  FieldPath,
  type DocumentSnapshot,
  type Firestore,
  type Query,
  type Transaction,
} from 'firebase-admin/firestore';
import type { Vehicle, VehicleInput } from '../../models/vehicle';
import { HttpError } from '../../utils/HttpError';
import { normalizeSearchTerm } from '../../utils/normalizeSearchTerm';
import { toPage } from '../../utils/pagination';
import type { VehicleRepository } from '../vehicleRepository';
import { toEntity } from './toEntity';

const COLLECTION = 'vehicles';
const PLATES_COLLECTION = 'vehiclePlates';

// Lowercase copies used only for case-insensitive filtering; never exposed by the API.
interface SearchFields {
  colorLower: string;
  brandLower: string;
}

// Builds the stored document from the input, adding the normalized copies used by the filters:
// { color: 'Black', brand: 'Fiat' } -> { ..., colorLower: 'black', brandLower: 'fiat' }.
function toDocument(data: VehicleInput): VehicleInput & SearchFields {
  return {
    ...data,
    colorLower: normalizeSearchTerm(data.color),
    brandLower: normalizeSearchTerm(data.brand),
  };
}

// Parses a stored document back into a Vehicle, removing the search-only fields.
function toVehicle(snapshot: DocumentSnapshot): Vehicle {
  const { colorLower, brandLower, ...vehicle } = toEntity<Vehicle & SearchFields>(snapshot);
  return vehicle;
}

export function createFirestoreVehicleRepository(db: Firestore): VehicleRepository {
  const vehicles = db.collection(COLLECTION);
  const plates = db.collection(PLATES_COLLECTION);

  const plateLock = (plate: string) => plates.doc(plate);

  // vehiclePlates/{plate} is created in the same transaction as the vehicle, so two concurrent requests
  // cannot register the same plate. The query also covers vehicles saved before the locks existed.
  async function ensurePlateAvailable(tx: Transaction, plate: string, vehicleId?: string) {
    const [lock, samePlate] = await Promise.all([
      tx.get(plateLock(plate)),
      tx.get(vehicles.where('plate', '==', plate).limit(2)),
    ]);

    const takenByLock = lock.exists && lock.get('vehicleId') !== vehicleId;
    const takenByVehicle = samePlate.docs.some((doc) => doc.id !== vehicleId);
    if (takenByLock || takenByVehicle) {
      throw HttpError.conflict(`A vehicle with plate ${plate} already exists`);
    }
  }

  return {
    async list({ color, brand }, { limit, cursor }) {
      let query: Query = vehicles.orderBy(FieldPath.documentId());
      if (color) query = query.where('colorLower', '==', normalizeSearchTerm(color));
      if (brand) query = query.where('brandLower', '==', normalizeSearchTerm(brand));
      if (cursor) query = query.startAfter(cursor);

      const snapshot = await query.limit(limit + 1).get();
      return toPage(snapshot.docs.map(toVehicle), limit);
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
      const ref = vehicles.doc();
      const now = new Date();

      await db.runTransaction(async (tx) => {
        await ensurePlateAvailable(tx, data.plate);

        tx.set(ref, { ...toDocument(data), createdAt: now, updatedAt: now });
        tx.set(plateLock(data.plate), { vehicleId: ref.id });
      });

      return toVehicle(await ref.get());
    },

    async update(id, data) {
      const ref = vehicles.doc(id);

      await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists) throw HttpError.notFound('Vehicle not found');

        const currentPlate: string = snapshot.get('plate');
        if (currentPlate !== data.plate) {
          await ensurePlateAvailable(tx, data.plate, id);
          tx.delete(plateLock(currentPlate));
        }

        tx.update(ref, { ...toDocument(data), updatedAt: new Date() });
        tx.set(plateLock(data.plate), { vehicleId: id });
      });

      return toVehicle(await ref.get());
    },

    async delete(id) {
      const ref = vehicles.doc(id);

      await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists) return;

        const lock = plateLock(snapshot.get('plate'));
        const lockSnapshot = await tx.get(lock);

        tx.delete(ref);
        if (lockSnapshot.get('vehicleId') === id) tx.delete(lock);
      });
    },
  };
}
