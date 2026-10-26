// Name search that ignores case and accents and matches the start of any word:
// "joao", "silva" and "jo sil" all match "João da Silva".

export function toSearchWords(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

// Every prefix of every word, stored with the document so Firestore can match it with array-contains.
export function buildPrefixIndex(text: string): string[] {
  const prefixes = new Set<string>();

  for (const word of toSearchWords(text)) {
    for (let end = 1; end <= word.length; end++) prefixes.add(word.slice(0, end));
  }

  return [...prefixes];
}

export function matchesNameQuery(name: string, searchQuery: string): boolean {
  const nameWords = toSearchWords(name);
  return toSearchWords(searchQuery).every((term) => nameWords.some((word) => word.startsWith(term)));
}
