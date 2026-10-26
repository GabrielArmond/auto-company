import { normalizarPlaca, validarAutomovel } from '../../src/validators/automovelValidator';

describe('automovelValidator', () => {
  describe('normalizarPlaca', () => {
    it('remove hífen/espaços e converte para maiúsculas', () => {
      expect(normalizarPlaca('abc-1234')).toBe('ABC1234');
      expect(normalizarPlaca(' abc 1d23 ')).toBe('ABC1D23');
    });
  });

  describe('validarAutomovel', () => {
    it.each(['ABC1234', 'ABC1D23', 'abc-1234'])('aceita a placa %s', (placa) => {
      expect(() => validarAutomovel({ placa, cor: 'Preto', marca: 'Fiat' })).not.toThrow();
    });

    it('retorna os dados normalizados e descarta campos extras', () => {
      expect(validarAutomovel({ placa: 'abc-1d23', cor: ' Preto ', marca: ' Fiat ', extra: 1 })).toEqual({
        placa: 'ABC1D23',
        cor: 'Preto',
        marca: 'Fiat',
      });
    });

    it('lista todos os campos obrigatórios ausentes', () => {
      expect(() => validarAutomovel({})).toThrow(
        expect.objectContaining({
          status: 400,
          details: [
            'O campo "placa" é obrigatório',
            'O campo "cor" é obrigatório',
            'O campo "marca" é obrigatório',
          ],
        }),
      );
    });

    it.each(['AB12345', 'ABCD123', '1234ABC', 'ABC12'])('rejeita a placa inválida %s', (placa) => {
      expect(() => validarAutomovel({ placa, cor: 'Preto', marca: 'Fiat' })).toThrow(
        expect.objectContaining({ status: 400 }),
      );
    });

    it.each([undefined, null, 'texto', 42])('trata body %p como vazio', (body) => {
      expect(() => validarAutomovel(body)).toThrow(expect.objectContaining({ status: 400 }));
    });
  });
});
