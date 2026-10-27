// Name search that ignores case and accents and matches the start of any word:
// "joao", "silva" and "jo sil" all match "João da Silva".

// Normalizes a text into searchable words: strips accents, lowercases and splits on whitespace,
// dropping empty parts: '  João da  Silva ' -> ['joao', 'da', 'silva'].
export function toSearchWords(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

// Every prefix of every word, stored with the document so Firestore can match it with array-contains:
// 'Ana Lima' -> ['a', 'an', 'ana', 'l', 'li', 'lim', 'lima'].
export function buildPrefixIndex(text: string): string[] {
  const prefixes = new Set<string>();

  for (const word of toSearchWords(text)) {
    for (let end = 1; end <= word.length; end++) prefixes.add(word.slice(0, end));
  }

  return [...prefixes];
}

// True when every word of the query is the start of some word of the name, after normalizing both with
// toSearchWords: ('João da Silva', 'jo sil') -> true; ('João da Silva', 'joao santos') -> false.
export function matchesNameQuery(name: string, searchQuery: string): boolean {
  const nameWords = toSearchWords(name);
  return toSearchWords(searchQuery).every((term) => nameWords.some((word) => word.startsWith(term)));
}
