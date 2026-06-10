import { formatDuration, formatPrice } from '@/lib/format';

describe('formatPrice', () => {
  it('rounds and appends the currency', () => {
    expect(formatPrice('180.00')).toBe('180 zł');
    expect(formatPrice('180.6')).toBe('181 zł');
  });

  it('formats zero as a price', () => {
    expect(formatPrice('0')).toBe('0 zł');
  });

  it('returns null for nullish/empty input', () => {
    expect(formatPrice(null)).toBeNull();
    expect(formatPrice(undefined)).toBeNull();
    expect(formatPrice('')).toBeNull();
  });

  it('passes non-numeric strings through unchanged', () => {
    expect(formatPrice('abc')).toBe('abc');
  });
});

describe('formatDuration', () => {
  it('appends the minutes unit', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(0)).toBe('0 min');
  });
});
