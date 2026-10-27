import type { Page } from '../models/pagination';

// Repositories fetch one item more than the page size; if it comes back, there is a next page,
// which starts after the last item returned now.
export function toPage<T extends { id: string }>(items: T[], limit: number): Page<T> {
  const data = items.slice(0, limit);
  return { data, nextCursor: items.length > limit ? data[data.length - 1].id : null };
}

// Same order Firestore uses for document ids (byte order, which matches string comparison for ASCII ids).
export function compareIds(a: { id: string }, b: { id: string }): number {
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}
