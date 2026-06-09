/**
 * Display formatting helpers shared across features. Currency follows the
 * team's existing convention: the backend serializes `price_display` as a
 * decimal string (e.g. "180.00") and examples show "$", but we render "zł"
 * client-side until the backend localizes price (design §9 G2).
 */

/** "180.00" → "180 zł"; null/non-numeric passes through (or is dropped). */
export function formatPrice(priceDisplay: string | null | undefined): string | null {
  if (!priceDisplay) return null;
  const value = Number(priceDisplay);
  return Number.isFinite(value) ? `${Math.round(value)} zł` : priceDisplay;
}

/** "45" → "45 min". Duration is always in minutes server-side. */
export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}
