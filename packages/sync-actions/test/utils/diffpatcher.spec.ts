import { diff, getDeltaValue, objectHash } from '../../src/utils/diffpatcher';

describe('diffpatcher (jsondiffpatch 0.7)', () => {
  describe('long-string diffing', () => {
    test('a changed long string is a whole-value replacement, not a text diff', () => {
      const long = 'x'.repeat(5000);
      const delta = diff({ desc: long }, { desc: `${long}CHANGED` }) as Record<
        string,
        unknown[]
      >;
      const stringDelta = delta.desc;
      expect(stringDelta).toHaveLength(2);
      expect(stringDelta[0]).toBe(long);
      expect(stringDelta[1]).toBe(`${long}CHANGED`);
    });
  });

  describe('objectHash', () => {
    test('prefers id, then name, then url, then falls back to index key', () => {
      expect(objectHash({ id: 'a', name: 'n', url: 'u' }, 0)).toBe('a');
      expect(objectHash({ name: 'n', url: 'u' } as never, 1)).toBe('n');
      expect(objectHash({ url: 'u' } as never, 2)).toBe('u');
      expect(objectHash(null as never, 3)).toBe('$$index:3');
    });
  });

  describe('getDeltaValue', () => {
    test('length 1 returns the added value', () => {
      expect(getDeltaValue([{ a: 1 }])).toEqual({ a: 1 });
    });

    test('length 2 returns the updated value', () => {
      expect(getDeltaValue([{ a: 1 }, { a: 2 }])).toEqual({ a: 2 });
    });

    test('length 3 ending in 0 is a delete and returns undefined', () => {
      expect(getDeltaValue([{ a: 1 }, 0, 0])).toBeUndefined();
    });

    test('text diff (trailing 2) without an original object throws', () => {
      expect(() => getDeltaValue(['@@ -1 +1 @@', 0, 2])).toThrow(
        /Missing original object/
      );
    });

    test('array move (trailing 3) throws because includeValueOnMove is false', () => {
      expect(() => getDeltaValue(['', 1, 3])).toThrow(/array move/);
    });

    test('a non-array delta throws', () => {
      expect(() => getDeltaValue('not-an-array')).toThrow(
        /Expected array to extract delta value/
      );
    });
  });
});
