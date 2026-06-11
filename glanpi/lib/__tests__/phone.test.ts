import { formatNationalPL, isValidPL, toE164 } from '@/lib/phone';

describe('isValidPL', () => {
  it('accepts exactly 9 digits', () => {
    expect(isValidPL('600700800')).toBe(true);
  });

  it('ignores spacing and separators when counting digits', () => {
    expect(isValidPL('600 700 800')).toBe(true);
  });

  it('rejects too few or too many digits', () => {
    expect(isValidPL('12345678')).toBe(false);
    expect(isValidPL('1234567890')).toBe(false);
  });

  it('rejects non-digit-only input that falls short', () => {
    expect(isValidPL('abc')).toBe(false);
  });
});

describe('toE164', () => {
  it('prefixes +48 and strips formatting', () => {
    expect(toE164('600 700 800')).toBe('+48600700800');
  });

  it('truncates to the 9-digit national part', () => {
    expect(toE164('6007008009999')).toBe('+48600700800');
  });
});

describe('formatNationalPL', () => {
  it('groups digits in threes', () => {
    expect(formatNationalPL('600700800')).toBe('600 700 800');
  });

  it('formats partial input without a trailing space', () => {
    expect(formatNationalPL('600700')).toBe('600 700');
    expect(formatNationalPL('6007')).toBe('600 7');
  });
});
