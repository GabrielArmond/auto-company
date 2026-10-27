import type { DriverRepository } from '../../src/repositories/driverRepository';
import { createDriverService, type DriverService } from '../../src/services/driverService';
import { createInMemoryDriverRepository } from '../../src/repositories/memory/driverRepository';
import { createInMemoryVehicleUsageRepository } from '../../src/repositories/memory/vehicleUsageRepository';

describe('driverService', () => {
  let repository: DriverRepository;
  let service: DriverService;

  beforeEach(() => {
    repository = createInMemoryDriverRepository([
      { id: '1', name: 'João da Silva' },
      { id: '2', name: 'Maria Souza' },
      { id: '3', name: 'Joana Silveira' },
    ]);
    const vehicleUsageRepository = createInMemoryVehicleUsageRepository([
      {
        driver: { id: '3', name: 'Joana Silveira' },
        vehicle: { id: 'v1', plate: 'AAA1111', color: 'Black', brand: 'Fiat' },
        reason: 'Ongoing trip',
        startDate: new Date('2026-01-02T08:00:00Z'),
      },
    ]);
    service = createDriverService(repository, vehicleUsageRepository);
  });

  describe('list', () => {
    it('lists all without filters', async () => {
      expect((await service.list()).data).toHaveLength(3);
    });

    it.each([
      ['joao', ['1']],
      ['JOÃO', ['1']],
      ['jo', ['1', '3']],
      ['silv', ['1', '3']],
      ['jo silva', ['1']],
      ['souza', ['2']],
      ['pedro', []],
    ])('filters by name %p', async (name, expectedIds) => {
      const result = await service.list({ name });
      expect(result.data.map((d) => d.id)).toEqual(expectedIds);
    });

    it('ignores an empty filter and trims whitespace', async () => {
      const spy = jest.spyOn(repository, 'list');

      await service.list({ name: '   ' });
      await service.list({ name: ' maria ' });

      expect(spy).toHaveBeenNthCalledWith(1, {}, { limit: 20 });
      expect(spy).toHaveBeenNthCalledWith(2, { name: 'maria' }, { limit: 20 });
    });
  });

  describe('getById', () => {
    it('returns the driver', async () => {
      expect(await service.getById('2')).toMatchObject({ name: 'Maria Souza' });
    });

    it('throws 404 when it does not exist', async () => {
      await expect(service.getById('99')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('create', () => {
    it('creates with the normalized name', async () => {
      const driver = await service.create({ name: '  Pedro   Alves ' });

      expect(driver).toMatchObject({ id: expect.any(String), name: 'Pedro Alves' });
      expect(await repository.findById(driver.id)).toEqual(driver);
    });

    it('rejects invalid data without saving', async () => {
      const spy = jest.spyOn(repository, 'create');

      await expect(service.create({})).rejects.toMatchObject({ status: 400 });
      expect(spy).not.toHaveBeenCalled();
    });

    it('allows drivers with the same name', async () => {
      await expect(service.create({ name: 'Maria Souza' })).resolves.toMatchObject({ name: 'Maria Souza' });
    });
  });

  describe('update', () => {
    it('updates the name', async () => {
      expect(await service.update('1', { name: 'João Pedro da Silva' })).toMatchObject({
        id: '1',
        name: 'João Pedro da Silva',
      });
    });

    it('throws 404 when it does not exist', async () => {
      await expect(service.update('99', { name: 'Ana' })).rejects.toMatchObject({ status: 404 });
    });

    it('rejects invalid data', async () => {
      await expect(service.update('1', { name: '' })).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('remove', () => {
    it('deletes the driver', async () => {
      await service.remove('1');
      expect(await repository.findById('1')).toBeNull();
    });

    it('rejects deleting a driver who is using a vehicle with 409', async () => {
      await expect(service.remove('3')).rejects.toMatchObject({ status: 409 });
      expect(await repository.findById('3')).not.toBeNull();
    });

    it('throws 404 when it does not exist', async () => {
      await expect(service.remove('99')).rejects.toMatchObject({ status: 404 });
    });
  });
});
