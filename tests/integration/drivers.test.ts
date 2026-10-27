import { createTestClient, type TestClient } from '../support/createTestApp';
import { createInMemoryDriverRepository } from '../support/inMemoryDriverRepository';

describe('API /api/drivers', () => {
  let api: TestClient;

  beforeEach(() => {
    const driverRepository = createInMemoryDriverRepository([
      { id: '1', name: 'João da Silva' },
      { id: '2', name: 'Maria Souza' },
    ]);
    api = createTestClient({ driverRepository });
  });

  it('GET lists all', async () => {
    const res = await api.get('/api/drivers');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('GET filters by name ignoring case and accents', async () => {
    const res = await api.get('/api/drivers').query({ name: 'JOAO' });

    expect(res.body).toEqual([expect.objectContaining({ id: '1', name: 'João da Silva' })]);
  });

  it('GET /:id returns 404 when it does not exist', async () => {
    const res = await api.get('/api/drivers/99');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Driver not found');
  });

  it('POST creates and PUT/DELETE operate on the record', async () => {
    const created = await api.post('/api/drivers').send({ name: '  Pedro  Alves ' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ id: expect.any(String), name: 'Pedro Alves' });
    expect(created.body).not.toHaveProperty('nameSearch');

    const { id } = created.body;

    const updated = await api.put(`/api/drivers/${id}`).send({ name: 'Pedro Henrique Alves' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Pedro Henrique Alves');

    expect((await api.get(`/api/drivers/${id}`)).body.name).toBe('Pedro Henrique Alves');

    expect((await api.delete(`/api/drivers/${id}`)).status).toBe(204);
    expect((await api.get(`/api/drivers/${id}`)).status).toBe(404);
  });

  it('POST returns 400 with validation details', async () => {
    const res = await api.post('/api/drivers').send({});

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(['The "name" field is required']);
  });

  it('PUT returns 404 when it does not exist', async () => {
    const res = await api.put('/api/drivers/99').send({ name: 'Ana' });

    expect(res.status).toBe(404);
  });
});
