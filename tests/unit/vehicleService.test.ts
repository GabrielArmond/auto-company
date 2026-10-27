import type { VehicleRepository } from '../../src/repositories/vehicleRepository';
import { createVehicleService, type VehicleService } from '../../src/services/vehicleService';
import { createInMemoryVehicleRepository } from '../../src/repositories/memory/vehicleRepository';
import { createInMemoryVehicleUsageRepository } from '../../src/repositories/memory/vehicleUsageRepository';

describe('vehicleService', () => {
  let repository: VehicleRepository;
  let service: VehicleService;

  beforeEach(() => {
    repository = createInMemoryVehicleRepository([
      { id: '1', plate: 'AAA1111', color: 'Black', brand: 'Fiat' },
      { id: '2', plate: 'BBB2222', color: 'White', brand: 'Fiat' },
      { id: '3', plate: 'CCC3333', color: 'Black', brand: 'Ford' },
    ]);
    const vehicleUsageRepository = createInMemoryVehicleUsageRepository([
      {
        driver: { id: 'd1', name: 'Ana' },
        vehicle: { id: '2', plate: 'BBB2222', color: 'White', brand: 'Fiat' },
        reason: 'Finished trip',
        startDate: new Date('2026-01-01T08:00:00Z'),
        endDate: new Date('2026-01-01T10:00:00Z'),
      },
      {
        driver: { id: 'd2', name: 'Bruno' },
        vehicle: { id: '3', plate: 'CCC3333', color: 'Black', brand: 'Ford' },
        reason: 'Ongoing trip',
        startDate: new Date('2026-01-02T08:00:00Z'),
      },
    ]);
    service = createVehicleService(repository, vehicleUsageRepository);
  });

  describe('list', () => {
    it('lists all without filters', async () => {
      expect((await service.list()).data).toHaveLength(3);
    });

    it('filters by color', async () => {
      const result = await service.list({ color: 'Black' });
      expect(result.data.map((v) => v.id)).toEqual(['1', '3']);
    });

    it('filters by brand', async () => {
      const result = await service.list({ brand: 'Fiat' });
      expect(result.data.map((v) => v.id)).toEqual(['1', '2']);
    });

    it('filters by color and brand together', async () => {
      const result = await service.list({ color: 'Black', brand: 'Fiat' });
      expect(result.data.map((v) => v.id)).toEqual(['1']);
    });

    it.each([
      { color: 'black', brand: 'FIAT' },
      { color: 'BLACK', brand: 'fiat' },
      { color: 'bLaCk', brand: 'FiAt' },
    ])('filters ignoring case (%o)', async (filters) => {
      const result = await service.list(filters);
      expect(result.data.map((v) => v.id)).toEqual(['1']);
    });

    it('ignores empty filters and trims whitespace', async () => {
      const spy = jest.spyOn(repository, 'list');

      await service.list({ color: '  ', brand: ' Fiat ' });

      expect(spy).toHaveBeenCalledWith({ brand: 'Fiat' }, { limit: 20 });
    });
  });

  describe('getById', () => {
    it('returns the vehicle', async () => {
      expect(await service.getById('1')).toMatchObject({ plate: 'AAA1111' });
    });

    it('throws 404 when it does not exist', async () => {
      await expect(service.getById('99')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('getByLicensePlate', () => {
    it('returns the vehicle', async () => {
      expect(await service.getByLicensePlate('BBB2222')).toMatchObject({ id: '2', plate: 'BBB2222' });
    });

    it.each(['bbb2222', 'bbb-2222', ' BBB 2222 '])('normalizes the informed plate (%p)', async (plate) => {
      expect(await service.getByLicensePlate(plate)).toMatchObject({ id: '2' });
    });

    it('throws 404 when no vehicle has the plate', async () => {
      await expect(service.getByLicensePlate('ZZZ9999')).rejects.toMatchObject({
        status: 404,
        message: 'Vehicle not found',
      });
    });
  });

  describe('create', () => {
    it('creates with the normalized plate', async () => {
      const vehicle = await service.create({ plate: 'ddd-4d44', color: 'Silver', brand: 'VW' });

      expect(vehicle).toMatchObject({ id: expect.any(String), plate: 'DDD4D44', color: 'Silver', brand: 'VW' });
      expect(await repository.findById(vehicle.id)).toEqual(vehicle);
    });

    it('rejects invalid data without saving', async () => {
      const spy = jest.spyOn(repository, 'create');

      await expect(service.create({ plate: 'xx' })).rejects.toMatchObject({ status: 400 });
      expect(spy).not.toHaveBeenCalled();
    });

    it('rejects an already registered plate with 409', async () => {
      await expect(service.create({ plate: 'aaa-1111', color: 'Blue', brand: 'Fiat' })).rejects.toMatchObject({
        status: 409,
      });
    });
  });

  describe('update', () => {
    it('updates the data keeping its own plate', async () => {
      const vehicle = await service.update('1', { plate: 'AAA1111', color: 'Red', brand: 'Fiat' });
      expect(vehicle).toMatchObject({ id: '1', color: 'Red' });
    });

    it('throws 404 when it does not exist', async () => {
      await expect(service.update('99', { plate: 'ZZZ9999', color: 'Blue', brand: 'Fiat' })).rejects.toMatchObject({
        status: 404,
      });
    });

    it("rejects changing to another vehicle's plate", async () => {
      await expect(service.update('1', { plate: 'BBB2222', color: 'Black', brand: 'Fiat' })).rejects.toMatchObject({
        status: 409,
      });
    });
  });

  describe('remove', () => {
    it('deletes the vehicle', async () => {
      await service.remove('1');
      expect(await repository.findById('1')).toBeNull();
    });

    it('deletes a vehicle that only has finished usages', async () => {
      await service.remove('2');
      expect(await repository.findById('2')).toBeNull();
    });

    it('rejects deleting a vehicle in use with 409', async () => {
      await expect(service.remove('3')).rejects.toMatchObject({ status: 409 });
      expect(await repository.findById('3')).not.toBeNull();
    });

    it('throws 404 when it does not exist', async () => {
      await expect(service.remove('99')).rejects.toMatchObject({ status: 404 });
    });
  });
});
