import type { AutomovelInput } from '../models/automovel';
import { HttpError } from '../utils/HttpError';

// Aceita o padrão antigo (ABC1234) e o Mercosul (ABC1D23).
const PLACA_REGEX = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;

export function normalizarPlaca(placa: unknown): unknown {
  return typeof placa === 'string' ? placa.replace(/[\s-]/g, '').toUpperCase() : placa;
}

function textoObrigatorio(valor: unknown, campo: string, erros: string[]): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    erros.push(`O campo "${campo}" é obrigatório`);
    return '';
  }
  return valor.trim();
}

export function validarAutomovel(body: unknown): AutomovelInput {
  const dados = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  const erros: string[] = [];

  const placa = textoObrigatorio(normalizarPlaca(dados.placa), 'placa', erros);
  if (placa && !PLACA_REGEX.test(placa)) {
    erros.push('O campo "placa" deve estar no formato ABC1234 ou ABC1D23');
  }

  const cor = textoObrigatorio(dados.cor, 'cor', erros);
  const marca = textoObrigatorio(dados.marca, 'marca', erros);

  if (erros.length) throw HttpError.badRequest('Dados inválidos', erros);

  return { placa, cor, marca };
}
