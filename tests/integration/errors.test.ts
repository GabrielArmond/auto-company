import { createInMemoryDriverRepository } from '../../src/repositories/memory/driverRepository';
import { createInMemoryVehicleRepository } from '../../src/repositories/memory/vehicleRepository';
import { createTestClient } from '../support/createTestApp';

describe('API error handling', () => {
  describe('invalid ids', () => {
    it.each([
      ['GET', '/api/vehicles/a%2Fb', 'Vehicle not found'],
      ['PUT', '/api/vehicles/..', 'Vehicle not found'],
      ['DELETE', `/api/vehicles/${'a'.repeat(129)}`, 'Vehicle not found'],
      ['GET', '/api/drivers/a%2Fb', 'Driver not found'],
      ['DELETE', '/api/drivers/a%20b', 'Driver not found'],
      ['GET', '/api/vehicle-usages/a%2Fb', 'Vehicle usage not found'],
      ['PATCH', '/api/vehicle-usages/a%2Fb/finish', 'Vehicle usage not found'],
    ])('%s %s returns 404 without reaching the repository', async (method, path, error) => {
      const vehicleRepository = createInMemoryVehicleRepository();
      const driverRepository = createInMemoryDriverRepository();
      const spies = [jest.spyOn(vehicleRepository, 'findById'), jest.spyOn(driverRepository, 'findById')];
      const api = createTestClient({ vehicleRepository, driverRepository });

      const body = { plate: 'ABC1D23', color: 'Black', brand: 'Fiat', name: 'Ana' };

      const res = await api[method.toLowerCase() as 'get'](path).send(body);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe(error);
      spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
    });

    it('rejects invalid driverId and vehicleId when starting a usage with 400', async () => {
      const res = await createTestClient()
        .post('/api/vehicle-usages')
        .send({ driverId: 'drivers/1', vehicleId: '../x', reason: 'Trip' });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual([
        'The "driverId" field must contain only letters, numbers, "-" or "_" (up to 128 characters)',
        'The "vehicleId" field must contain only letters, numbers, "-" or "_" (up to 128 characters)',
      ]);
    });
  });

  describe('unexpected errors', () => {
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('returns a generic 500 without the internal message', async () => {
      const vehicleRepository = createInMemoryVehicleRepository();
      jest.spyOn(vehicleRepository, 'list').mockRejectedValue(new Error('7 PERMISSION_DENIED: projects/secret-project'));

      const res = await createTestClient({ vehicleRepository }).get('/api/vehicles');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal Server Error' });
      expect(JSON.stringify(res.body)).not.toContain('secret-project');
      expect(consoleError).toHaveBeenCalled();
    });

    it('returns a generic message for malformed JSON', async () => {
      const res = await createTestClient()
        .post('/api/vehicles')
        .set('Content-Type', 'application/json')
        .send('{"plate":');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Malformed JSON body' });
    });

    it('returns 413 for bodies over the size limit', async () => {
      const res = await createTestClient()
        .post('/api/drivers')
        .send({ name: 'x'.repeat(200 * 1024) });

      expect(res.status).toBe(413);
      expect(res.body).toEqual({ error: 'Payload Too Large' });
    });
  });
});
