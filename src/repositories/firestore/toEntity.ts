import { Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';

// Parses a DocumentSnapshot into a plain entity: adds the document id and turns Firestore Timestamps into
// ISO strings, so the API returns the same shape as the in-memory repositories:
// doc 'abc' { name: 'Ana', createdAt: Timestamp } -> { id: 'abc', name: 'Ana', createdAt: '2026-01-01T08:00:00.000Z' }.
export function toEntity<T extends { id: string }>(doc: DocumentSnapshot): T {
  const entity: Record<string, unknown> = { id: doc.id };

  for (const [key, value] of Object.entries(doc.data() ?? {})) {
    entity[key] = value instanceof Timestamp ? value.toDate().toISOString() : value;
  }

  return entity as T;
}
