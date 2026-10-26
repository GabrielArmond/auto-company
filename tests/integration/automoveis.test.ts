import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { createAutomovelService } from '../../src/services/automovelService';
import { createInMemoryAutomovelRepository } from '../support/inMemoryAutomovelRepository';

describe('API /api/automoveis', () => {
  let app: Express;

  beforeEach(() => {
    const automovelRepository = createInMemoryAutomovelRepository([
      { id: '1', placa: 'AAA1111', cor: 'Preto', marca: 'Fiat' },
      { id: '2', placa: 'BBB2222', cor: 'Branco', marca: 'Ford' },
    ]);
    app = createApp({ automovelService: createAutomovelService(automovelRepository) });
  });

  it('GET /api/health', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET lista todos', async () => {
    const res = await request(app).get('/api/automoveis');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('GET filtra por cor e marca via query string', async () => {
    const res = await request(app).get('/api/automoveis').query({ cor: 'Preto', marca: 'Fiat' });

    expect(res.body).toEqual([expect.objectContaining({ id: '1' })]);
  });

  it('GET /:id retorna 404 quando não existe', async () => {
    const res = await request(app).get('/api/automoveis/99');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Automóvel não encontrado');
  });

  it('POST cria e PUT/DELETE operam sobre o registro', async () => {
    const created = await request(app).post('/api/automoveis').send({ placa: 'ccc-3c33', cor: 'Prata', marca: 'VW' });
    expect(created.status).toBe(201);
    expect(created.body.placa).toBe('CCC3C33');

    const { id } = created.body;

    const updated = await request(app).put(`/api/automoveis/${id}`).send({ placa: 'CCC3C33', cor: 'Azul', marca: 'VW' });
    expect(updated.status).toBe(200);
    expect(updated.body.cor).toBe('Azul');

    expect((await request(app).get(`/api/automoveis/${id}`)).body.cor).toBe('Azul');

    expect((await request(app).delete(`/api/automoveis/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/automoveis/${id}`)).status).toBe(404);
  });

  it('POST retorna 400 com os detalhes de validação', async () => {
    const res = await request(app).post('/api/automoveis').send({ placa: 'x' });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(expect.arrayContaining(['O campo "cor" é obrigatório']));
  });

  it('POST retorna 409 para placa duplicada', async () => {
    const res = await request(app).post('/api/automoveis').send({ placa: 'AAA1111', cor: 'Azul', marca: 'Fiat' });

    expect(res.status).toBe(409);
  });

  it('retorna 400 para JSON malformado', async () => {
    const res = await request(app)
      .post('/api/automoveis')
      .set('Content-Type', 'application/json')
      .send('{"placa":');

    expect(res.status).toBe(400);
  });

  it('retorna 404 em JSON para rotas inexistentes', async () => {
    const res = await request(app).get('/api/nao-existe');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
