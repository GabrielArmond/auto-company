// Parses a query string parameter into a single string. Express gives an array when the parameter is
// repeated (?color=a&color=b) and an object for nested syntax (?color[x]=a); both are ignored so they
// cannot reach the filters: 'Black' -> 'Black'; ['a', 'b'] -> undefined; missing -> undefined.
export function queryString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
