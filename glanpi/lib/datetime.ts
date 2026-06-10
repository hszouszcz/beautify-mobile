/**
 * Date/time helpers for the booking flow. The backend pre-formats slot times in
 * the salon timezone (`AvailabilityResponse.slot_options[].display`), so we never
 * parse wall-clock slot strings — we only need to (a) build the horizontal date
 * strip, (b) know which weekdays a salon is closed, and (c) compute open-now in
 * the salon's timezone. `Intl` covers all of this — no date dependency needed
 * (plan §8.3).
 */

import type { Booking, BusinessHours } from '@/api';

/** ISO weekday with Monday=0 … Sunday=6 (matches `BusinessHours.day_of_week`). */
export function dayOfWeekMon0(isoDate: string): number {
  // Anchor at UTC noon so the calendar date never shifts across a tz boundary.
  const d = new Date(`${isoDate}T12:00:00Z`);
  return (d.getUTCDay() + 6) % 7;
}

/** Current calendar date (YYYY-MM-DD) in a given timezone. */
export function todayInTz(timeZone?: string): string {
  // en-CA renders ISO-ordered YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Add `n` days to a YYYY-MM-DD string, returning a YYYY-MM-DD string. */
export function addDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type DateStripItem = {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // Mon=0 … Sun=6
  weekdayShort: string; // "pn", "wt" (pl-PL)
  dayNumber: string; // "12"
  isToday: boolean;
};

/** Build `count` consecutive days starting today (in the salon timezone). */
export function buildDateStrip(count: number, timeZone?: string): DateStripItem[] {
  const today = todayInTz(timeZone);
  const weekdayFmt = new Intl.DateTimeFormat('pl-PL', { weekday: 'short', timeZone: 'UTC' });
  const dayFmt = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', timeZone: 'UTC' });

  return Array.from({ length: count }, (_, i) => {
    const date = addDays(today, i);
    const anchor = new Date(`${date}T12:00:00Z`);
    return {
      date,
      dayOfWeek: dayOfWeekMon0(date),
      weekdayShort: weekdayFmt.format(anchor).replace('.', ''),
      dayNumber: dayFmt.format(anchor),
      isToday: i === 0,
    };
  });
}

/** Full PL weekday name for a Mon=0…Sun=6 index, e.g. 0 → "poniedziałek". */
export function weekdayLongPL(dayOfWeekMon0: number): string {
  // 2024-01-01 was a Monday → its offset gives the wanted weekday.
  const anchor = new Date(`${addDays('2024-01-01', dayOfWeekMon0)}T12:00:00Z`);
  const label = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(anchor);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Month + year label for the strip header, e.g. "czerwiec 2026". */
export function monthLabel(isoDate: string, timeZone?: string): string {
  const anchor = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat('pl-PL', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(anchor);
}

/** Set of weekdays (Mon=0 … Sun=6) the salon is closed, from business hours. */
export function closedDays(hours: BusinessHours[] | undefined): Set<number> {
  const set = new Set<number>();
  for (const h of hours ?? []) {
    if (h.is_closed || !h.open_time || !h.close_time) set.add(h.day_of_week);
  }
  return set;
}

/** "09:00:00" → "09:00". */
export function formatSlotTime(time: string): string {
  return time.slice(0, 5);
}

/** YYYY-MM-DD → "wt, 12 cze" (for the running booking summary). */
export function formatShortDate(isoDate: string): string {
  const anchor = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat('pl-PL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
    .format(anchor)
    .replace(/\./g, '');
}

/** YYYY-MM-DD → "12 cze" (compact day + short month, for filter chips). */
export function formatDayMonthShort(isoDate: string): string {
  const anchor = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
    .format(anchor)
    .replace(/\./g, '');
}

/**
 * Compact label for a date range on the Find "Kiedy" chip. Collapses to a single
 * date when `to` is missing or equal to `from`; drops the repeated month when
 * both ends share one ("12–16 cze"), otherwise spells both ("28 cze – 3 lip").
 */
export function formatDateRangeShort(from: string, to?: string): string {
  if (!to || to === from) return formatDayMonthShort(from);
  if (from.slice(0, 7) === to.slice(0, 7)) {
    const dayFrom = Number(from.slice(8, 10));
    return `${dayFrom}–${formatDayMonthShort(to)}`;
  }
  return `${formatDayMonthShort(from)} – ${formatDayMonthShort(to)}`;
}

/** "09:00" → "9", "14:30" → "14:30" — drops the leading zero and a :00 suffix for chips. */
export function compactClock(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return m === '00' ? String(Number(h)) : `${Number(h)}:${m}`;
}

/** YYYY-MM-DD → "12 czerwca" (Confirmation copy). */
export function formatLongDate(isoDate: string): string {
  const anchor = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(anchor);
}

/**
 * ISO-UTC timestamp → "Wt, 12 cze · 09:00" in the salon's timezone. Unlike the
 * `YYYY-MM-DD` helpers above, a booking carries a full instant (`start_time`),
 * so we render both the calendar date and the wall-clock time in `timeZone`
 * (the salon's), falling back to the device timezone when it's missing.
 */
export function formatBookingDateTime(isoUtc: string, timeZone?: string): string {
  const instant = new Date(isoUtc);
  const date = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone,
  })
    .format(instant)
    .replace(/\./g, '');
  const time = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(instant);
  const capitalized = date.charAt(0).toUpperCase() + date.slice(1);
  return `${capitalized} · ${time}`;
}

/**
 * Whether a booking belongs to the "Minione" (past) section. A booking is past
 * if it's `COMPLETED`/`CANCELLED`, or its `end_time` has already passed — so a
 * future-but-cancelled visit never shows under "Nadchodzące". ISO-UTC strings
 * compare lexicographically against the current UTC instant.
 */
export function isPastBooking(booking: Booking): boolean {
  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') return true;
  return booking.end_time < new Date().toISOString();
}

export type PartOfDay = 'morning' | 'afternoon' | 'evening';

/** Bucket a "09:00:00" slot start into morning (<12) / afternoon (<17) / evening. */
export function partOfDay(startTime: string): PartOfDay {
  const hour = Number(startTime.slice(0, 2));
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export type OpenStatus =
  | { state: 'open'; until: string } // "18:00"
  | { state: 'closed' } // closed now (opens later or just closed today)
  | { state: 'closedToday' }; // salon doesn't open at all today

/** Open-now status for the identity pill, evaluated in the salon's timezone. */
export function getOpenStatus(
  hours: BusinessHours[] | undefined,
  timeZone?: string,
): OpenStatus | null {
  if (!hours || hours.length === 0) return null;

  const today = todayInTz(timeZone);
  const dow = dayOfWeekMon0(today);
  const todayHours = hours.find((h) => h.day_of_week === dow);

  if (!todayHours || todayHours.is_closed || !todayHours.open_time || !todayHours.close_time) {
    return { state: 'closedToday' };
  }

  const now = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date()); // "14:30"

  const open = todayHours.open_time.slice(0, 5);
  const close = todayHours.close_time.slice(0, 5);

  if (now >= open && now < close) {
    return { state: 'open', until: close };
  }
  return { state: 'closed' };
}
