import type { AutomovelFiltros } from '../models/automovel';
import type { AutomovelRepository } from '../repositories/automovelRepository';
import { HttpError } from '../utils/HttpError';
import { validarAutomovel } from '../validators/automovelValidator';

export type AutomovelService = ReturnType<typeof createAutomovelService>;

export function createAutomovelService(automovelRepository: AutomovelRepository) {
  async function getById(id: string) {
    const automovel = await automovelRepository.findById(id);
    if (!automovel) throw HttpError.notFound('Automóvel não encontrado');
    return automovel;
  }

  async function garantirPlacaDisponivel(placa: string, idAtual?: string) {
    const existente = await automovelRepository.findByPlaca(placa);
    if (existente && existente.id !== idAtual) {
      throw HttpError.conflict(`Já existe um automóvel com a placa ${placa}`);
    }
  }

  return {
    getById,

    list({ cor, marca }: AutomovelFiltros = {}) {
      const filtros: AutomovelFiltros = {};
      if (cor?.trim()) filtros.cor = cor.trim();
      if (marca?.trim()) filtros.marca = marca.trim();

      return automovelRepository.list(filtros);
    },

    async create(body: unknown) {
      const dados = validarAutomovel(body);
      await garantirPlacaDisponivel(dados.placa);
      return automovelRepository.create(dados);
    },

    async update(id: string, body: unknown) {
      await getById(id);
      const dados = validarAutomovel(body);
      await garantirPlacaDisponivel(dados.placa, id);
      return automovelRepository.update(id, dados);
    },

    async remove(id: string) {
      await getById(id);
      await automovelRepository.delete(id);
    },
  };
}
