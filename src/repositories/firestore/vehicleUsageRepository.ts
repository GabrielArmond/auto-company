import type { DocumentReference, DocumentSnapshot, Firestore } from 'firebase-admin/firestore';
import type { VehicleUsage } from '../../models/vehicleUsage';
import { HttpError } from '../../utils/HttpError';
import { toPage } from '../../utils/pagination';
import { ensureStartsAfterHistory } from '../usageHistory';
import type { VehicleUsageRepository } from '../vehicleUsageRepository';
import { toEntity } from './toEntity';

const COLLECTION = 'vehicleUsages';
const LOCKS_COLLECTION = 'activeUsages';
const HISTORY_COLLECTION = 'usageHistory';

export function createFirestoreVehicleUsageRepository(db: Firestore): VehicleUsageRepository {
  const usages = db.collection(COLLECTION);
  const locks = db.collection(LOCKS_COLLECTION);
  const history = db.collection(HISTORY_COLLECTION);

  const vehicleLock = (vehicleId: string) => locks.doc(`vehicle_${vehicleId}`);
  const driverLock = (driverId: string) => locks.doc(`driver_${driverId}`);
  const vehicleHistory = (vehicleId: string) => history.doc(`vehicle_${vehicleId}`);
  const driverHistory = (driverId: string) => history.doc(`driver_${driverId}`);

  const lastEndDate = (snapshot: DocumentSnapshot): Date | null => snapshot.get('lastEndDate')?.toDate() ?? null;

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

    async list({ limit, cursor }) {
      let query = usages.orderBy('startDate', 'desc');
      if (cursor) {
        const cursorSnapshot = await usages.doc(cursor).get();
        if (!cursorSnapshot.exists) throw HttpError.badRequest('Invalid cursor');
        query = query.startAfter(cursorSnapshot);
      }

      const snapshot = await query.limit(limit + 1).get();
      return toPage(snapshot.docs.map((d) => toEntity<VehicleUsage>(d)), limit);
    },

    findActiveByVehicle: (vehicleId) => findByLock(vehicleLock(vehicleId)),

    findActiveByDriver: (driverId) => findByLock(driverLock(driverId)),

    async create(data) {
      const ref = usages.doc();
      const now = new Date();

      await db.runTransaction(async (tx) => {
        const vehicleLockRef = vehicleLock(data.vehicle.id);
        const driverLockRef = driverLock(data.driver.id);

        const [vehicleLockSnapshot, driverLockSnapshot, vehicleHistorySnapshot, driverHistorySnapshot] =
          await Promise.all([
            tx.get(vehicleLockRef),
            tx.get(driverLockRef),
            tx.get(vehicleHistory(data.vehicle.id)),
            tx.get(driverHistory(data.driver.id)),
          ]);

        if (vehicleLockSnapshot.exists) {
          throw HttpError.conflict(`Vehicle ${data.vehicle.plate} is already in use`);
        }
        if (driverLockSnapshot.exists) {
          throw HttpError.conflict(`Driver ${data.driver.name} is already using another vehicle`);
        }
        ensureStartsAfterHistory(data, {
          vehicle: lastEndDate(vehicleHistorySnapshot),
          driver: lastEndDate(driverHistorySnapshot),
        });

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
        tx.set(vehicleHistory(current.vehicle.id), { lastEndDate: endDate });
        tx.set(driverHistory(current.driver.id), { lastEndDate: endDate });

        return current;
      });

      return { ...usage, endDate: endDate.toISOString(), updatedAt: now.toISOString() };
    },
  };
}
