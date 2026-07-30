import { mapProps, omitUndefined } from './object.mapper';

describe('object.mapper', () => {
  describe('mapProps', () => {
    it('maps defined values to new keys', () => {
      const result = mapProps(
        { a: 1, b: 'x' },
        { a: 'alpha', b: 'beta' },
      );
      expect(result).toEqual({ alpha: 1, beta: 'x' });
    });

    it('skips undefined values', () => {
      const result = mapProps(
        { a: 1, b: undefined },
        { a: 'alpha', b: 'beta' },
      );
      expect(result).toEqual({ alpha: 1 });
      expect('beta' in result).toBe(false);
    });

    it('returns empty object for undefined source', () => {
      const result = mapProps(undefined, { a: 'alpha' });
      expect(result).toEqual({});
    });
  });

  describe('omitUndefined', () => {
    it('removes only undefined values', () => {
      const result = omitUndefined({
        a: 1,
        b: undefined,
        c: null,
        d: false,
      });
      expect(result).toEqual({ a: 1, c: null, d: false });
    });
  });
});
