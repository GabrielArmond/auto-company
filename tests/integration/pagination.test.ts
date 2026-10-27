import { createInMemoryDriverRepository } from '../../src/repositories/memory/driverRepository';
import { createInMemoryVehicleRepository } from '../../src/repositories/memory/vehicleRepository';
import { createInMemoryVehicleUsageRepository } from '../../src/repositories/memory/vehicleUsageRepository';
import { createTestClient, type TestClient } from '../support/createTestApp';

async function collectIds(api: TestClient, path: string, query: Record<string, string>) {
  const ids: string[] = [];
  let cursor: string | null = null;
  do {
    const res = await api.get(path).query(cursor ? { ...query, cursor } : query);
    expect(res.status).toBe(200);
    ids.push(...res.body.data.map((item: { id: string }) => item.id));
    cursor = res.body.nextCursor;
  } while (cursor);
  return ids;
}

describe('API pagination', () => {
  const vehicles = ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({
    id,
    plate: `AAA${i}111`,
    color: i % 2 ? 'White' : 'Black',
    brand: 'Fiat',
  }));

  it('returns pages of the requested size with a cursor to the next one', async () => {
    const api = createTestClient({ vehicleRepository: createInMemoryVehicleRepository(vehicles) });

    const first = await api.get('/api/vehicles').query({ limit: 2 });
    expect(first.body.data.map((v: { id: string }) => v.id)).toEqual(['a', 'b']);
    expect(first.body.nextCursor).toBe('b');

    const second = await api.get('/api/vehicles').query({ limit: 2, cursor: 'b' });
    expect(second.body.data.map((v: { id: string }) => v.id)).toEqual(['c', 'd']);

    const last = await api.get('/api/vehicles').query({ limit: 2, cursor: 'd' });
    expect(last.body).toEqual({ data: [expect.objectContaining({ id: 'e' })], nextCursor: null });
  });

  it('paginates filtered vehicles', async () => {
    const api = createTestClient({ vehicleRepository: createInMemoryVehicleRepository(vehicles) });

    expect(await collectIds(api, '/api/vehicles', { color: 'black', limit: '1' })).toEqual(['a', 'c', 'e']);
  });

  it('paginates drivers filtered by name', async () => {
    const driverRepository = createInMemoryDriverRepository([
      { id: '1', name: 'Ana Lima' },
      { id: '2', name: 'Bruno Souza' },
      { id: '3', name: 'Ana Souza' },
      { id: '4', name: 'Anabela Reis' },
    ]);
    const api = createTestClient({ driverRepository });

    expect(await collectIds(api, '/api/drivers', { name: 'ana', limit: '2' })).toEqual(['1', '3', '4']);
  });

  it('paginates vehicle usages from the most recent, without repeating or skipping', async () => {
    const usage = (id: string, startDate: string) => ({
      id,
      driver: { id: `d${id}`, name: `Driver ${id}` },
      vehicle: { id: `v${id}`, plate: 'AAA1111', color: 'Black', brand: 'Fiat' },
      reason: 'Trip',
      startDate: new Date(startDate),
      endDate: new Date('2026-02-01T00:00:00Z'),
    });
    const vehicleUsageRepository = createInMemoryVehicleUsageRepository([
      usage('u1', '2026-01-01T08:00:00Z'),
      usage('u2', '2026-01-03T08:00:00Z'),
      usage('u3', '2026-01-02T08:00:00Z'),
      usage('u4', '2026-01-03T08:00:00Z'),
    ]);
    const api = createTestClient({ vehicleUsageRepository });

    expect(await collectIds(api, '/api/vehicle-usages', { limit: '1' })).toEqual(['u4', 'u2', 'u3', 'u1']);
  });

  it('uses the default page size of 20', async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      plate: `ABC${i % 10}D${String(i).padStart(2, '0')}`,
      color: 'Black',
      brand: 'Fiat',
    }));
    const api = createTestClient({ vehicleRepository: createInMemoryVehicleRepository(many) });

    const res = await api.get('/api/vehicles');

    expect(res.body.data).toHaveLength(20);
    expect(res.body.nextCursor).not.toBeNull();
  });

  it.each([
    ['/api/vehicles', { limit: '0' }],
    ['/api/drivers', { limit: '101' }],
    ['/api/vehicle-usages', { cursor: 'a/b' }],
  ])('GET %s returns 400 for invalid pagination %o', async (path, query) => {
    const res = await createTestClient().get(path).query(query);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid query parameters');
  });

  it('returns 400 for a vehicle usage cursor that does not exist', async () => {
    const res = await createTestClient().get('/api/vehicle-usages').query({ cursor: 'missing' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid cursor');
  });
});
