// Normalizes a filter value for case-insensitive exact matching: trims and lowercases it
// (' Black ' -> 'black'). Firestore only supports exact matches, so searchable fields are stored and
// queried in this form (see colorLower/brandLower in the vehicle repository).
export function normalizeSearchTerm(value: string): string {
  return value.trim().toLowerCase();
}
