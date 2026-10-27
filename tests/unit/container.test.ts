import { createContainer } from '../../src/container';

describe('createContainer', () => {
  it('wires in-memory repositories with the memory database', async () => {
    const { vehicleService, driverService, vehicleUsageService } = await createContainer('memory');

    const vehicle = await vehicleService.create({ plate: 'ABC1D23', color: 'Black', brand: 'Fiat' });
    const driver = await driverService.create({ name: 'Ana' });
    await vehicleUsageService.start({ vehicleId: vehicle.id, driverId: driver.id, reason: 'Client visit' });

    expect(await vehicleUsageService.list()).toHaveLength(1);
  });

  it('creates an independent store on each call', async () => {
    const first = await createContainer('memory');
    await first.driverService.create({ name: 'Ana' });

    const second = await createContainer('memory');

    expect(await second.driverService.list()).toEqual([]);
  });

  it('rejects an unknown database', async () => {
    await expect(createContainer('mongodb')).rejects.toThrow('Invalid DATABASE "mongodb". Use one of: memory, firestore');
  });
});
