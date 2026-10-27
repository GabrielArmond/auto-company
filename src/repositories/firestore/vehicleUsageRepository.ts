import type { DocumentReference, Firestore } from 'firebase-admin/firestore';
import type { VehicleUsage } from '../../models/vehicleUsage';
import { HttpError } from '../../utils/HttpError';
import type { VehicleUsageRepository } from '../vehicleUsageRepository';
import { toEntity } from './toEntity';

const COLLECTION = 'vehicleUsages';
const LOCKS_COLLECTION = 'activeUsages';

export function createFirestoreVehicleUsageRepository(db: Firestore): VehicleUsageRepository {
  const usages = db.collection(COLLECTION);
  const locks = db.collection(LOCKS_COLLECTION);

  const vehicleLock = (vehicleId: string) => locks.doc(`vehicle_${vehicleId}`);
  const driverLock = (driverId: string) => locks.doc(`driver_${driverId}`);

  async function findById(id: string) {
    const snapshot = await usages.doc(id).get();
    return snapshot.exists ? toEntity<VehicleUsage>(snapshot) : null;
  }

  async function findByLock(lock: DocumentReference) {
    const snapshot = await lock.get();
    return snapshot.exists ? findById(snapshot.get('usageId')) : null;
  }

  return {
    findById,

    async list() {
      const snapshot = await usages.orderBy('startDate', 'desc').get();
      return snapshot.docs.map((d) => toEntity<VehicleUsage>(d));
    },

    findActiveByVehicle: (vehicleId) => findByLock(vehicleLock(vehicleId)),

    findActiveByDriver: (driverId) => findByLock(driverLock(driverId)),

    async create(data) {
      const ref = usages.doc();
      const now = new Date();

      await db.runTransaction(async (tx) => {
        const vehicleLockRef = vehicleLock(data.vehicle.id);
        const driverLockRef = driverLock(data.driver.id);

        if ((await tx.get(vehicleLockRef)).exists) {
          throw HttpError.conflict(`Vehicle ${data.vehicle.plate} is already in use`);
        }
        if ((await tx.get(driverLockRef)).exists) {
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
      const ref = usages.doc(id);
      const now = new Date();

      const usage = await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists) throw HttpError.notFound('Vehicle usage not found');

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
