import { Timestamp, type DocumentSnapshot } from 'firebase/firestore';

// Converts a DocumentSnapshot into a plain object, turning Timestamps into ISO strings.
export function toEntity<T extends { id: string }>(doc: DocumentSnapshot): T {
  const entity: Record<string, unknown> = { id: doc.id };

  for (const [key, value] of Object.entries(doc.data() ?? {})) {
    entity[key] = value instanceof Timestamp ? value.toDate().toISOString() : value;
  }

  return entity as T;
}
