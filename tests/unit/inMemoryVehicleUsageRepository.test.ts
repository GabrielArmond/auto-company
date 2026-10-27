import { createInMemoryVehicleUsageRepository } from '../../src/repositories/memory/vehicleUsageRepository';

const usage = (vehicleId: string, driverId: string, startDate = '2026-01-01T08:00:00Z') => ({
  vehicle: { id: vehicleId, plate: `AAA${vehicleId}111`, color: 'Black', brand: 'Fiat' },
  driver: { id: driverId, name: `Driver ${driverId}` },
  reason: 'Trip',
  startDate: new Date(startDate),
});

describe('in-memory vehicleUsageRepository', () => {
  it('rejects a second active usage of the same vehicle', async () => {
    const repository = createInMemoryVehicleUsageRepository([usage('1', 'a')]);

    await expect(repository.create(usage('1', 'b'))).rejects.toMatchObject({ status: 409 });
  });

  it('rejects a second active usage by the same driver', async () => {
    const repository = createInMemoryVehicleUsageRepository([usage('1', 'a')]);

    await expect(repository.create(usage('2', 'a'))).rejects.toMatchObject({ status: 409 });
  });

  it('allows a new usage starting when the previous one ended', async () => {
    const repository = createInMemoryVehicleUsageRepository();
    const first = await repository.create(usage('1', 'a'));
    await repository.finish(first.id, new Date('2026-01-01T09:00:00Z'));

    await expect(repository.create(usage('1', 'a', '2026-01-01T09:00:00Z'))).resolves.toMatchObject({ endDate: null });
  });

  it('rejects a usage of the vehicle starting before its last usage ended', async () => {
    const repository = createInMemoryVehicleUsageRepository([
      { ...usage('1', 'a'), endDate: new Date('2026-01-01T10:00:00Z') },
    ]);

    await expect(repository.create(usage('1', 'b', '2026-01-01T09:00:00Z'))).rejects.toMatchObject({
      status: 409,
      message: 'Vehicle AAA1111 was in use until 2026-01-01T10:00:00.000Z; the usage cannot start before that',
    });
  });

  it('rejects a usage by the driver starting before their last usage ended', async () => {
    const repository = createInMemoryVehicleUsageRepository([
      { ...usage('1', 'a'), endDate: new Date('2026-01-01T10:00:00Z') },
    ]);

    await expect(repository.create(usage('2', 'a', '2026-01-01T07:00:00Z'))).rejects.toMatchObject({
      status: 409,
      message: 'Driver Driver a was using a vehicle until 2026-01-01T10:00:00.000Z; the usage cannot start before that',
    });
  });

  it('only compares with the history of the same vehicle and driver', async () => {
    const repository = createInMemoryVehicleUsageRepository([
      { ...usage('1', 'a'), endDate: new Date('2026-01-01T10:00:00Z') },
    ]);

    await expect(repository.create(usage('2', 'b', '2026-01-01T09:00:00Z'))).resolves.toMatchObject({ endDate: null });
  });

  it('rejects finishing a missing or already finished usage', async () => {
    const repository = createInMemoryVehicleUsageRepository([{ ...usage('1', 'a'), id: 'done', endDate: new Date() }]);

    await expect(repository.finish('missing', new Date())).rejects.toMatchObject({ status: 404 });
    await expect(repository.finish('done', new Date())).rejects.toMatchObject({ status: 409 });
  });
});
