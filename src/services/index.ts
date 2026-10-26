import type { AutomovelService } from './automovelService';

// Conjunto de services que o app recebe (montado em container.ts ou nos testes).
export interface Services {
  automovelService: AutomovelService;
}
