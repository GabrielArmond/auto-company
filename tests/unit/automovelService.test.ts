import type { AutomovelRepository } from '../../src/repositories/automovelRepository';
import { createAutomovelService, type AutomovelService } from '../../src/services/automovelService';
import { createInMemoryAutomovelRepository } from '../support/inMemoryAutomovelRepository';

describe('automovelService', () => {
  let repository: AutomovelRepository;
  let service: AutomovelService;

  beforeEach(() => {
    repository = createInMemoryAutomovelRepository([
      { id: '1', placa: 'AAA1111', cor: 'Preto', marca: 'Fiat' },
      { id: '2', placa: 'BBB2222', cor: 'Branco', marca: 'Fiat' },
      { id: '3', placa: 'CCC3333', cor: 'Preto', marca: 'Ford' },
    ]);
    service = createAutomovelService(repository);
  });

  describe('list', () => {
    it('lista todos sem filtros', async () => {
      expect(await service.list()).toHaveLength(3);
    });

    it('filtra por cor', async () => {
      const result = await service.list({ cor: 'Preto' });
      expect(result.map((a) => a.id)).toEqual(['1', '3']);
    });

    it('filtra por marca', async () => {
      const result = await service.list({ marca: 'Fiat' });
      expect(result.map((a) => a.id)).toEqual(['1', '2']);
    });

    it('filtra por cor e marca juntos', async () => {
      const result = await service.list({ cor: 'Preto', marca: 'Fiat' });
      expect(result.map((a) => a.id)).toEqual(['1']);
    });

    it('ignora filtros vazios e remove espaços', async () => {
      const spy = jest.spyOn(repository, 'list');

      await service.list({ cor: '  ', marca: ' Fiat ' });

      expect(spy).toHaveBeenCalledWith({ marca: 'Fiat' });
    });
  });

  describe('getById', () => {
    it('retorna o automóvel', async () => {
      expect(await service.getById('1')).toMatchObject({ placa: 'AAA1111' });
    });

    it('lança 404 quando não existe', async () => {
      await expect(service.getById('99')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('create', () => {
    it('cria com a placa normalizada', async () => {
      const automovel = await service.create({ placa: 'ddd-4d44', cor: 'Prata', marca: 'VW' });

      expect(automovel).toMatchObject({ id: expect.any(String), placa: 'DDD4D44', cor: 'Prata', marca: 'VW' });
      expect(await repository.findById(automovel.id)).toEqual(automovel);
    });

    it('rejeita dados inválidos sem gravar', async () => {
      const spy = jest.spyOn(repository, 'create');

      await expect(service.create({ placa: 'xx' })).rejects.toMatchObject({ status: 400 });
      expect(spy).not.toHaveBeenCalled();
    });

    it('rejeita placa já cadastrada com 409', async () => {
      await expect(service.create({ placa: 'aaa-1111', cor: 'Azul', marca: 'Fiat' })).rejects.toMatchObject({
        status: 409,
      });
    });
  });

  describe('update', () => {
    it('atualiza os dados mantendo a própria placa', async () => {
      const automovel = await service.update('1', { placa: 'AAA1111', cor: 'Vermelho', marca: 'Fiat' });
      expect(automovel).toMatchObject({ id: '1', cor: 'Vermelho' });
    });

    it('lança 404 quando não existe', async () => {
      await expect(service.update('99', { placa: 'ZZZ9999', cor: 'Azul', marca: 'Fiat' })).rejects.toMatchObject({
        status: 404,
      });
    });

    it('rejeita trocar para a placa de outro automóvel', async () => {
      await expect(service.update('1', { placa: 'BBB2222', cor: 'Preto', marca: 'Fiat' })).rejects.toMatchObject({
        status: 409,
      });
    });
  });

  describe('remove', () => {
    it('exclui o automóvel', async () => {
      await service.remove('1');
      expect(await repository.findById('1')).toBeNull();
    });

    it('lança 404 quando não existe', async () => {
      await expect(service.remove('99')).rejects.toMatchObject({ status: 404 });
    });
  });
});
