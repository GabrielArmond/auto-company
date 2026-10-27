import { createInMemoryVehicleRepository } from '../../src/repositories/memory/vehicleRepository';
import { createTestClient, type TestClient } from '../support/createTestApp';

describe('API /api/vehicles', () => {
  let api: TestClient;

  beforeEach(() => {
    const vehicleRepository = createInMemoryVehicleRepository([
      { id: '1', plate: 'AAA1111', color: 'Black', brand: 'Fiat' },
      { id: '2', plate: 'BBB2222', color: 'White', brand: 'Ford' },
    ]);
    api = createTestClient({ vehicleRepository });
  });

  it('GET /api/health', async () => {
    const res = await api.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET lists all', async () => {
    const res = await api.get('/api/vehicles');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('GET filters by color and brand via query string', async () => {
    const res = await api.get('/api/vehicles').query({ color: 'Black', brand: 'Fiat' });

    expect(res.body).toEqual([expect.objectContaining({ id: '1' })]);
  });

  it('GET filters ignoring case and keeps the original values in the response', async () => {
    const res = await api.get('/api/vehicles').query({ color: 'BLACK', brand: 'fiat' });

    expect(res.body).toEqual([expect.objectContaining({ id: '1', color: 'Black', brand: 'Fiat' })]);
  });

  it('GET /:id returns 404 when it does not exist', async () => {
    const res = await api.get('/api/vehicles/99');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Vehicle not found');
  });

  it('GET /plate/:plate returns the vehicle with that plate', async () => {
    const res = await api.get('/api/vehicles/plate/BBB2222');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: '2', plate: 'BBB2222', color: 'White', brand: 'Ford' });
  });

  it('GET /plate/:plate accepts lowercase and hyphenated plates', async () => {
    const res = await api.get('/api/vehicles/plate/aaa-1111');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('1');
  });

  it('GET /plate/:plate returns 404 when no vehicle has the plate', async () => {
    const res = await api.get('/api/vehicles/plate/ZZZ9999');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Vehicle not found');
  });

  it('GET /plate/:plate finds a vehicle right after it is created', async () => {
    await api.post('/api/vehicles').send({ plate: 'DDD4D44', color: 'Silver', brand: 'VW' });

    const res = await api.get('/api/vehicles/plate/ddd4d44');

    expect(res.status).toBe(200);
    expect(res.body.plate).toBe('DDD4D44');
  });

  it('POST creates and PUT/DELETE operate on the record', async () => {
    const created = await api.post('/api/vehicles').send({ plate: 'ccc-3c33', color: 'Silver', brand: 'VW' });
    expect(created.status).toBe(201);
    expect(created.body.plate).toBe('CCC3C33');

    const { id } = created.body;

    const updated = await api.put(`/api/vehicles/${id}`).send({ plate: 'CCC3C33', color: 'Blue', brand: 'VW' });
    expect(updated.status).toBe(200);
    expect(updated.body.color).toBe('Blue');

    expect((await api.get(`/api/vehicles/${id}`)).body.color).toBe('Blue');

    expect((await api.delete(`/api/vehicles/${id}`)).status).toBe(204);
    expect((await api.get(`/api/vehicles/${id}`)).status).toBe(404);
  });

  it('POST returns 400 with validation details', async () => {
    const res = await api.post('/api/vehicles').send({ plate: 'x' });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(expect.arrayContaining(['The "color" field is required']));
  });

  it('POST returns 409 for a duplicate plate', async () => {
    const res = await api.post('/api/vehicles').send({ plate: 'AAA1111', color: 'Blue', brand: 'Fiat' });

    expect(res.status).toBe(409);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await api
      .post('/api/vehicles')
      .set('Content-Type', 'application/json')
      .send('{"plate":');

    expect(res.status).toBe(400);
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await api.get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
