import type { VehicleUsageRepository } from '../../src/repositories/vehicleUsageRepository';
import { createVehicleUsageService, type VehicleUsageService } from '../../src/services/vehicleUsageService';
import { createInMemoryDriverRepository } from '../support/inMemoryDriverRepository';
import { createInMemoryVehicleRepository } from '../support/inMemoryVehicleRepository';
import { createInMemoryVehicleUsageRepository } from '../support/inMemoryVehicleUsageRepository';

const now = new Date('2026-05-10T12:00:00Z');

describe('vehicleUsageService', () => {
  let vehicleUsageRepository: VehicleUsageRepository;
  let service: VehicleUsageService;

  beforeEach(() => {
    const vehicleRepository = createInMemoryVehicleRepository([
      { id: 'v1', plate: 'AAA1111', color: 'Black', brand: 'Fiat' },
      { id: 'v2', plate: 'BBB2222', color: 'White', brand: 'Ford' },
      { id: 'v3', plate: 'CCC3333', color: 'Red', brand: 'VW' },
    ]);
    const driverRepository = createInMemoryDriverRepository([
      { id: 'd1', name: 'Ana Lima' },
      { id: 'd2', name: 'Bruno Costa' },
      { id: 'd3', name: 'Carla Dias' },
    ]);
    vehicleUsageRepository = createInMemoryVehicleUsageRepository([
      {
        id: 'u1',
        driver: { id: 'd1', name: 'Ana Lima' },
        vehicle: { id: 'v1', plate: 'AAA1111', color: 'Black', brand: 'Fiat' },
        reason: 'Ongoing trip',
        startDate: new Date('2026-05-10T09:00:00Z'),
      },
      {
        id: 'u2',
        driver: { id: 'd2', name: 'Bruno Costa' },
        vehicle: { id: 'v2', plate: 'BBB2222', color: 'White', brand: 'Ford' },
        reason: 'Finished trip',
        startDate: new Date('2026-05-09T08:00:00Z'),
        endDate: new Date('2026-05-09T10:00:00Z'),
      },
    ]);
    service = createVehicleUsageService({
      vehicleUsageRepository,
      vehicleRepository,
      driverRepository,
      now: () => now,
    });
  });

  describe('list', () => {
    it('lists usages, most recent first, with driver and vehicle data', async () => {
      const result = await service.list();

      expect(result.map((u) => u.id)).toEqual(['u1', 'u2']);
      expect(result[0]).toMatchObject({
        driver: { name: 'Ana Lima' },
        vehicle: { plate: 'AAA1111', color: 'Black', brand: 'Fiat' },
      });
    });
  });

  describe('getById', () => {
    it('returns the usage', async () => {
      expect(await service.getById('u2')).toMatchObject({ reason: 'Finished trip' });
    });

    it('throws 404 when it does not exist', async () => {
      await expect(service.getById('nope')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('start', () => {
    it('starts a usage with driver and vehicle snapshots', async () => {
      const usage = await service.start({ driverId: 'd3', vehicleId: 'v3', reason: 'Bank errand' });

      expect(usage).toMatchObject({
        id: expect.any(String),
        driver: { id: 'd3', name: 'Carla Dias' },
        vehicle: { id: 'v3', plate: 'CCC3333', color: 'Red', brand: 'VW' },
        reason: 'Bank errand',
        startDate: now.toISOString(),
        endDate: null,
      });
    });

    it('uses the informed startDate', async () => {
      const usage = await service.start({
        driverId: 'd3',
        vehicleId: 'v3',
        reason: 'Bank errand',
        startDate: '2026-05-10T07:00:00Z',
      });

      expect(usage.startDate).toBe('2026-05-10T07:00:00.000Z');
    });

    it('allows a vehicle and a driver whose previous usage is finished', async () => {
      await expect(service.start({ driverId: 'd2', vehicleId: 'v2', reason: 'New trip' })).resolves.toMatchObject({
        endDate: null,
      });
    });

    it('rejects a vehicle already in use by another driver', async () => {
      await expect(service.start({ driverId: 'd3', vehicleId: 'v1', reason: 'Trip' })).rejects.toMatchObject({
        status: 409,
        message: 'Vehicle AAA1111 is already in use by Ana Lima',
      });
    });

    it('rejects a driver who is already using another vehicle', async () => {
      await expect(service.start({ driverId: 'd1', vehicleId: 'v3', reason: 'Trip' })).rejects.toMatchObject({
        status: 409,
        message: 'Driver Ana Lima is already using vehicle AAA1111',
      });
    });

    it('rejects an unknown vehicle with 404', async () => {
      await expect(service.start({ driverId: 'd3', vehicleId: 'nope', reason: 'Trip' })).rejects.toMatchObject({
        status: 404,
        message: 'Vehicle not found',
      });
    });

    it('rejects an unknown driver with 404', async () => {
      await expect(service.start({ driverId: 'nope', vehicleId: 'v3', reason: 'Trip' })).rejects.toMatchObject({
        status: 404,
        message: 'Driver not found',
      });
    });

    it('rejects invalid data without saving', async () => {
      const spy = jest.spyOn(vehicleUsageRepository, 'create');

      await expect(service.start({ driverId: 'd3' })).rejects.toMatchObject({ status: 400 });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('finish', () => {
    it('finishes the usage with the current date by default', async () => {
      const usage = await service.finish('u1', undefined);
      expect(usage).toMatchObject({ id: 'u1', endDate: now.toISOString() });
    });

    it('finishes the usage with the informed endDate', async () => {
      const usage = await service.finish('u1', { endDate: '2026-05-10T11:00:00Z' });
      expect(usage.endDate).toBe('2026-05-10T11:00:00.000Z');
    });

    it('releases the vehicle and the driver for new usages', async () => {
      await service.finish('u1', {});

      await expect(service.start({ driverId: 'd1', vehicleId: 'v3', reason: 'Next trip' })).resolves.toBeDefined();
      await expect(service.start({ driverId: 'd3', vehicleId: 'v1', reason: 'Next trip' })).resolves.toBeDefined();
    });

    it('rejects an already finished usage with 409', async () => {
      await expect(service.finish('u2', {})).rejects.toMatchObject({ status: 409 });
    });

    it('rejects an endDate before the start date with 400', async () => {
      await expect(service.finish('u1', { endDate: '2026-05-10T08:00:00Z' })).rejects.toMatchObject({ status: 400 });
    });

    it('throws 404 when it does not exist', async () => {
      await expect(service.finish('nope', {})).rejects.toMatchObject({ status: 404 });
    });
  });
});
