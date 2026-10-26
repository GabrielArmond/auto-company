import request from 'supertest';
import type { Express } from 'express';
import { createTestApp } from '../support/createTestApp';
import { createInMemoryDriverRepository } from '../support/inMemoryDriverRepository';
import { createInMemoryVehicleRepository } from '../support/inMemoryVehicleRepository';

describe('API /api/vehicle-usages', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp({
      vehicleRepository: createInMemoryVehicleRepository([
        { id: 'v1', plate: 'AAA1111', color: 'Black', brand: 'Fiat' },
        { id: 'v2', plate: 'BBB2222', color: 'White', brand: 'Ford' },
      ]),
      driverRepository: createInMemoryDriverRepository([
        { id: 'd1', name: 'Ana Lima' },
        { id: 'd2', name: 'Bruno Costa' },
      ]),
    });
  });

  const start = (body: object) => request(app).post('/api/vehicle-usages').send(body);

  it('runs the full usage lifecycle', async () => {
    const started = await start({ driverId: 'd1', vehicleId: 'v1', reason: 'Client visit' });
    expect(started.status).toBe(201);
    expect(started.body).toMatchObject({
      driver: { id: 'd1', name: 'Ana Lima' },
      vehicle: { id: 'v1', plate: 'AAA1111', color: 'Black', brand: 'Fiat' },
      reason: 'Client visit',
      endDate: null,
    });

    const { id } = started.body;

    const finished = await request(app).patch(`/api/vehicle-usages/${id}/finish`);
    expect(finished.status).toBe(200);
    expect(finished.body.endDate).toEqual(expect.any(String));

    const list = await request(app).get('/api/vehicle-usages');
    expect(list.status).toBe(200);
    expect(list.body).toEqual([expect.objectContaining({ id, driver: expect.objectContaining({ name: 'Ana Lima' }) })]);

    expect((await request(app).get(`/api/vehicle-usages/${id}`)).body.id).toBe(id);
  });

  it('returns 409 when the vehicle is already in use', async () => {
    await start({ driverId: 'd1', vehicleId: 'v1', reason: 'Trip' });

    const res = await start({ driverId: 'd2', vehicleId: 'v1', reason: 'Trip' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Vehicle AAA1111 is already in use by Ana Lima');
  });

  it('returns 409 when the driver is already using another vehicle', async () => {
    await start({ driverId: 'd1', vehicleId: 'v1', reason: 'Trip' });

    const res = await start({ driverId: 'd1', vehicleId: 'v2', reason: 'Trip' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Driver Ana Lima is already using vehicle AAA1111');
  });

  it('returns 409 when finishing twice', async () => {
    const { body } = await start({ driverId: 'd1', vehicleId: 'v1', reason: 'Trip' });
    await request(app).patch(`/api/vehicle-usages/${body.id}/finish`);

    const res = await request(app).patch(`/api/vehicle-usages/${body.id}/finish`);

    expect(res.status).toBe(409);
  });

  it('blocks deleting a vehicle or driver while in use, and allows it after finishing', async () => {
    const { body } = await start({ driverId: 'd1', vehicleId: 'v1', reason: 'Trip' });

    expect((await request(app).delete('/api/vehicles/v1')).status).toBe(409);
    expect((await request(app).delete('/api/drivers/d1')).status).toBe(409);

    await request(app).patch(`/api/vehicle-usages/${body.id}/finish`);

    expect((await request(app).delete('/api/vehicles/v1')).status).toBe(204);
    expect((await request(app).delete('/api/drivers/d1')).status).toBe(204);

    const usage = await request(app).get(`/api/vehicle-usages/${body.id}`);
    expect(usage.body).toMatchObject({ driver: { name: 'Ana Lima' }, vehicle: { plate: 'AAA1111' } });
  });

  it('returns 400 with validation details', async () => {
    const res = await start({ vehicleId: 'v1' });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(['The "driverId" field is required', 'The "reason" field is required']);
  });

  it('returns 404 for an unknown vehicle', async () => {
    const res = await start({ driverId: 'd1', vehicleId: 'nope', reason: 'Trip' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Vehicle not found');
  });

  it('returns 404 when finishing an unknown usage', async () => {
    expect((await request(app).patch('/api/vehicle-usages/nope/finish')).status).toBe(404);
  });
});
