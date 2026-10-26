import type { DocumentSnapshot } from 'firebase-admin/firestore';

// Converte um DocumentSnapshot em objeto simples, trocando Timestamps por ISO strings.
export function toEntity<T extends { id: string }>(doc: DocumentSnapshot): T {
  const entity: Record<string, unknown> = { id: doc.id };

  for (const [key, value] of Object.entries(doc.data() ?? {})) {
    entity[key] = typeof value?.toDate === 'function' ? value.toDate().toISOString() : value;
  }

  return entity as T;
}
