import type { VehicleRepository } from '../../src/repositories/vehicleRepository';
import { createVehicleService, type VehicleService } from '../../src/services/vehicleService';
import { createInMemoryVehicleRepository } from '../support/inMemoryVehicleRepository';

describe('vehicleService', () => {
  let repository: VehicleRepository;
  let service: VehicleService;

  beforeEach(() => {
    repository = createInMemoryVehicleRepository([
      { id: '1', plate: 'AAA1111', color: 'Black', brand: 'Fiat' },
      { id: '2', plate: 'BBB2222', color: 'White', brand: 'Fiat' },
      { id: '3', plate: 'CCC3333', color: 'Black', brand: 'Ford' },
    ]);
    service = createVehicleService(repository);
  });

  describe('list', () => {
    it('lists all without filters', async () => {
      expect(await service.list()).toHaveLength(3);
    });

    it('filters by color', async () => {
      const result = await service.list({ color: 'Black' });
      expect(result.map((v) => v.id)).toEqual(['1', '3']);
    });

    it('filters by brand', async () => {
      const result = await service.list({ brand: 'Fiat' });
      expect(result.map((v) => v.id)).toEqual(['1', '2']);
    });

    it('filters by color and brand together', async () => {
      const result = await service.list({ color: 'Black', brand: 'Fiat' });
      expect(result.map((v) => v.id)).toEqual(['1']);
    });

    it('ignores empty filters and trims whitespace', async () => {
      const spy = jest.spyOn(repository, 'list');

      await service.list({ color: '  ', brand: ' Fiat ' });

      expect(spy).toHaveBeenCalledWith({ brand: 'Fiat' });
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

    it('throws 404 when it does not exist', async () => {
      await expect(service.remove('99')).rejects.toMatchObject({ status: 404 });
    });
  });
});
