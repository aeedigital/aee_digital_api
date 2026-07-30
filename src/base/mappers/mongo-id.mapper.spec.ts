import { extractId } from './mongo-id.mapper';

describe('mongo-id.mapper', () => {
  it('returns undefined for nullish values', () => {
    expect(extractId(null)).toBeUndefined();
    expect(extractId(undefined)).toBeUndefined();
  });

  it('extracts string from _id', () => {
    const value = { _id: { toString: () => 'abc' } };
    expect(extractId(value)).toBe('abc');
  });

  it('falls back to toString or raw value', () => {
    const withToString = { toString: () => 'xyz' };
    expect(extractId(withToString)).toBe('xyz');
    expect(extractId('raw')).toBe('raw');
  });
});
