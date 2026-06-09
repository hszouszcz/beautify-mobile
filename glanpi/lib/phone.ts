/**
 * Polish phone-number helpers. The product is PL-only at MVP (PRD §1), so the
 * country code is fixed to +48 and the national part is exactly 9 digits.
 * Numbers are sent to the backend in E.164 (PRD §8 "Format danych").
 */

const PL_PREFIX = '+48';
const NATIONAL_DIGITS = 9;

/** Strip everything but digits. */
function digitsOnly(input: string): string {
  return input.replace(/\D/g, '');
}

/** True when `national` is exactly 9 digits (a valid PL subscriber number). */
export function isValidPL(national: string): boolean {
  return digitsOnly(national).length === NATIONAL_DIGITS;
}

/** Compose E.164 from a 9-digit national number: "600700800" → "+48600700800". */
export function toE164(national: string): string {
  return `${PL_PREFIX}${digitsOnly(national).slice(0, NATIONAL_DIGITS)}`;
}

/** "600700800" → "600 700 800" for in-field display (groups of 3). */
export function formatNationalPL(national: string): string {
  const digits = digitsOnly(national).slice(0, NATIONAL_DIGITS);
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}
