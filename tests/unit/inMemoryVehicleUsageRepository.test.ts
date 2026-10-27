import { createInMemoryVehicleUsageRepository } from '../../src/repositories/memory/vehicleUsageRepository';

const usage = (vehicleId: string, driverId: string) => ({
  vehicle: { id: vehicleId, plate: `AAA${vehicleId}111`, color: 'Black', brand: 'Fiat' },
  driver: { id: driverId, name: `Driver ${driverId}` },
  reason: 'Trip',
  startDate: new Date('2026-01-01T08:00:00Z'),
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

  it('allows a new usage after the previous one is finished', async () => {
    const repository = createInMemoryVehicleUsageRepository();
    const first = await repository.create(usage('1', 'a'));
    await repository.finish(first.id, new Date('2026-01-01T09:00:00Z'));

    await expect(repository.create(usage('1', 'a'))).resolves.toMatchObject({ endDate: null });
  });

  it('rejects finishing a missing or already finished usage', async () => {
    const repository = createInMemoryVehicleUsageRepository([{ ...usage('1', 'a'), id: 'done', endDate: new Date() }]);

    await expect(repository.finish('missing', new Date())).rejects.toMatchObject({ status: 404 });
    await expect(repository.finish('done', new Date())).rejects.toMatchObject({ status: 409 });
  });
});
