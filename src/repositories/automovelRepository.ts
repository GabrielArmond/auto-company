import type { Automovel, AutomovelFiltros, AutomovelInput } from '../models/automovel';

// Contrato usado pelo service; implementado pelo Firestore e, nos testes, em memória.
export interface AutomovelRepository {
  list(filtros?: AutomovelFiltros): Promise<Automovel[]>;
  findById(id: string): Promise<Automovel | null>;
  findByPlaca(placa: string): Promise<Automovel | null>;
  create(data: AutomovelInput): Promise<Automovel>;
  update(id: string, data: AutomovelInput): Promise<Automovel>;
  delete(id: string): Promise<void>;
}
