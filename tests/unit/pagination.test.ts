import { compareIds, toPage } from '../../src/utils/pagination';

const items = (...ids: string[]) => ids.map((id) => ({ id }));

describe('toPage', () => {
  it('returns the next cursor when there are more items than the limit', () => {
    expect(toPage(items('a', 'b', 'c'), 2)).toEqual({ data: items('a', 'b'), nextCursor: 'b' });
  });

  it('returns a null cursor on the last page', () => {
    expect(toPage(items('a', 'b'), 2)).toEqual({ data: items('a', 'b'), nextCursor: null });
    expect(toPage([], 2)).toEqual({ data: [], nextCursor: null });
  });
});

describe('compareIds', () => {
  it('orders ids as strings, like Firestore document ids', () => {
    expect(items('b', '10', 'A', '2', 'a').sort(compareIds).map((i) => i.id)).toEqual(['10', '2', 'A', 'a', 'b']);
  });
});
