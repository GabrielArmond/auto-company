import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import type { VehicleUsage } from '../../models/vehicleUsage';
import { HttpError } from '../../utils/HttpError';
import type { VehicleUsageRepository } from '../vehicleUsageRepository';
import { toEntity } from './toEntity';

const COLLECTION = 'vehicleUsages';
const LOCKS_COLLECTION = 'activeUsages';

interface UsageLock {
  usageId: string;
}

export function createFirestoreVehicleUsageRepository(db: Firestore): VehicleUsageRepository {
  const usages = collection(db, COLLECTION);
  const locks = collection(db, LOCKS_COLLECTION);

  const vehicleLock = (vehicleId: string) => doc(locks, `vehicle_${vehicleId}`) as DocumentReference<UsageLock>;
  const driverLock = (driverId: string) => doc(locks, `driver_${driverId}`) as DocumentReference<UsageLock>;

  async function findById(id: string) {
    const snapshot = await getDoc(doc(usages, id));
    return snapshot.exists() ? toEntity<VehicleUsage>(snapshot) : null;
  }

  async function findByLock(lock: DocumentReference<UsageLock>) {
    const snapshot = await getDoc(lock);
    return snapshot.exists() ? findById(snapshot.data().usageId) : null;
  }

  return {
    findById,

    async list() {
      const snapshot = await getDocs(query(usages, orderBy('startDate', 'desc')));
      return snapshot.docs.map((d) => toEntity<VehicleUsage>(d));
    },

    findActiveByVehicle: (vehicleId) => findByLock(vehicleLock(vehicleId)),

    findActiveByDriver: (driverId) => findByLock(driverLock(driverId)),

    async create(data) {
      const ref = doc(usages);
      const now = new Date();

      await runTransaction(db, async (tx) => {
        const vehicleLockRef = vehicleLock(data.vehicle.id);
        const driverLockRef = driverLock(data.driver.id);

        if ((await tx.get(vehicleLockRef)).exists()) {
          throw HttpError.conflict(`Vehicle ${data.vehicle.plate} is already in use`);
        }
        if ((await tx.get(driverLockRef)).exists()) {
          throw HttpError.conflict(`Driver ${data.driver.name} is already using another vehicle`);
        }

        tx.set(ref, { ...data, endDate: null, createdAt: now, updatedAt: now });
        tx.set(vehicleLockRef, { usageId: ref.id });
        tx.set(driverLockRef, { usageId: ref.id });
      });

      return {
        id: ref.id,
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
    },

    async finish(id, endDate) {
      const ref = doc(usages, id);
      const now = new Date();

      const usage = await runTransaction(db, async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists()) throw HttpError.notFound('Vehicle usage not found');

        const current = toEntity<VehicleUsage>(snapshot);
        if (current.endDate) throw HttpError.conflict('Vehicle usage is already finished');

        tx.update(ref, { endDate, updatedAt: now });
        tx.delete(vehicleLock(current.vehicle.id));
        tx.delete(driverLock(current.driver.id));

        return current;
      });

      return { ...usage, endDate: endDate.toISOString(), updatedAt: now.toISOString() };
    },
  };
}
