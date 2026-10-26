export interface Automovel {
  id: string;
  placa: string;
  cor: string;
  marca: string;
  createdAt: string;
  updatedAt: string;
}

export type AutomovelInput = Pick<Automovel, 'placa' | 'cor' | 'marca'>;

export interface AutomovelFiltros {
  cor?: string;
  marca?: string;
}
