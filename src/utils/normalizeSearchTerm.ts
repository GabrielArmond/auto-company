// Firestore only supports exact matches, so searchable fields are stored and queried in this form.
export function normalizeSearchTerm(value: string): string {
  return value.trim().toLowerCase();
}
