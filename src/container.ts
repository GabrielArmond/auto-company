import { getDb } from './config/firebase';
import { createFirestoreAutomovelRepository } from './repositories/firestore/automovelRepository';
import { createAutomovelService } from './services/automovelService';
import type { Services } from './services';

// Monta as dependências reais (Firestore). Nos testes, o app recebe repositórios em memória.
export function createContainer(): Services {
  const db = getDb();

  const automovelRepository = createFirestoreAutomovelRepository(db);

  return {
    automovelService: createAutomovelService(automovelRepository),
  };
}
