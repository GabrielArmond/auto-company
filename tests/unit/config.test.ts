import { parseList, parsePositiveInt, parseTrustProxy } from '../../src/config';

describe('config parsing', () => {
  it.each([
    [' key1, key2,,', ['key1', 'key2']],
    ['single', ['single']],
    ['', []],
    [undefined, []],
  ])('parseList(%p)', (value, expected) => {
    expect(parseList(value)).toEqual(expected);
  });

  it.each([
    [undefined, 0],
    ['', 0],
    ['0', 0],
    ['1', 1],
    ['2', 2],
  ])('parseTrustProxy(%p) -> %p', (value, expected) => {
    expect(parseTrustProxy(value)).toBe(expected);
  });

  it.each(['true', 'loopback', '-1', '1.5'])('parseTrustProxy rejects %p', (value) => {
    expect(() => parseTrustProxy(value)).toThrow('Invalid TRUST_PROXY');
  });

  it.each([
    ['100', 100],
    [undefined, 7],
    ['', 7],
    ['0', 7],
    ['-5', 7],
    ['1.5', 7],
    ['abc', 7],
  ])('parsePositiveInt(%p) -> %p', (value, expected) => {
    expect(parsePositiveInt(value, 7)).toBe(expected);
  });
});
