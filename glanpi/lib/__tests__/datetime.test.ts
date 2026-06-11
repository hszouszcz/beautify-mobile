import type { BusinessHours } from '@/api';
import {
  addDays,
  buildDateStrip,
  closedDays,
  compactClock,
  dayOfWeekMon0,
  formatDateRangeShort,
  formatSlotTime,
  getOpenStatus,
  partOfDay,
  todayInTz,
  weekdayLongPL,
} from '@/lib/datetime';

/** Build a BusinessHours row with sensible defaults for the day under test. */
function hours(partial: Partial<BusinessHours> & { day_of_week: number }): BusinessHours {
  return {
    id: partial.day_of_week,
    salon: 1,
    day_name: 'x',
    open_time: '09:00:00',
    close_time: '18:00:00',
    is_closed: false,
    ...partial,
  };
}

describe('dayOfWeekMon0', () => {
  // 2024-01-01 is a Monday — the module itself relies on this anchor.
  it('maps Monday to 0 and Sunday to 6', () => {
    expect(dayOfWeekMon0('2024-01-01')).toBe(0); // Mon
    expect(dayOfWeekMon0('2024-01-02')).toBe(1); // Tue
    expect(dayOfWeekMon0('2024-01-07')).toBe(6); // Sun
  });

  it('is stable regardless of host timezone (anchored at UTC noon)', () => {
    expect(dayOfWeekMon0('2026-06-10')).toBe(2); // Wed
  });
});

describe('addDays', () => {
  it('rolls over month boundaries', () => {
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
  });

  it('handles leap day', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('rolls over year boundaries', () => {
    expect(addDays('2023-12-31', 1)).toBe('2024-01-01');
  });

  it('subtracts with a negative offset', () => {
    expect(addDays('2024-01-01', -1)).toBe('2023-12-31');
  });
});

describe('todayInTz', () => {
  afterEach(() => jest.useRealTimers());

  it('reflects the calendar day in the target timezone across the UTC midnight boundary', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-10T23:30:00Z'));
    // Warsaw is UTC+2 in June → already past midnight there.
    expect(todayInTz('Europe/Warsaw')).toBe('2026-06-11');
  });
});

describe('buildDateStrip', () => {
  afterEach(() => jest.useRealTimers());

  it('produces consecutive days starting today with isToday only on the first', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-10T10:00:00Z'));
    const strip = buildDateStrip(3, 'Europe/Warsaw');
    expect(strip).toHaveLength(3);
    expect(strip.map((d) => d.date)).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']);
    expect(strip[0].isToday).toBe(true);
    expect(strip[1].isToday).toBe(false);
    expect(strip[0].dayNumber).toBe('10');
  });
});

describe('closedDays', () => {
  it('collects explicitly closed days and days missing open/close times', () => {
    const set = closedDays([
      hours({ day_of_week: 0 }), // open
      hours({ day_of_week: 6, is_closed: true }), // explicit closed
      hours({ day_of_week: 3, open_time: null, close_time: null }), // no hours
    ]);
    expect(set.has(0)).toBe(false);
    expect(set.has(6)).toBe(true);
    expect(set.has(3)).toBe(true);
  });

  it('returns an empty set for undefined input', () => {
    expect(closedDays(undefined).size).toBe(0);
  });
});

describe('formatDateRangeShort', () => {
  it('collapses to a single day when `to` is missing or equal', () => {
    expect(formatDateRangeShort('2026-06-12')).toBe('12 cze');
    expect(formatDateRangeShort('2026-06-12', '2026-06-12')).toBe('12 cze');
  });

  it('drops the repeated month within one month', () => {
    expect(formatDateRangeShort('2026-06-12', '2026-06-16')).toBe('12–16 cze');
  });

  it('spells both ends across months', () => {
    expect(formatDateRangeShort('2026-06-28', '2026-07-03')).toBe('28 cze – 3 lip');
  });
});

describe('small formatters', () => {
  it('formatSlotTime trims seconds', () => {
    expect(formatSlotTime('09:00:00')).toBe('09:00');
  });

  it('compactClock drops leading zero and :00 suffix', () => {
    expect(compactClock('09:00')).toBe('9');
    expect(compactClock('14:30')).toBe('14:30');
    expect(compactClock('09:30')).toBe('9:30');
  });

  it('partOfDay buckets by hour', () => {
    expect(partOfDay('09:00:00')).toBe('morning');
    expect(partOfDay('12:00:00')).toBe('afternoon');
    expect(partOfDay('17:00:00')).toBe('evening');
  });

  it('weekdayLongPL returns a capitalized Polish weekday', () => {
    expect(weekdayLongPL(0)).toBe('Poniedziałek');
  });
});

describe('getOpenStatus', () => {
  afterEach(() => jest.useRealTimers());

  it('returns null when no hours are known', () => {
    expect(getOpenStatus(undefined, 'Europe/Warsaw')).toBeNull();
    expect(getOpenStatus([], 'Europe/Warsaw')).toBeNull();
  });

  it('reports open within business hours (salon timezone)', () => {
    // 10:00 UTC → 12:00 in Warsaw, a Wednesday (dow=2).
    jest.useFakeTimers().setSystemTime(new Date('2026-06-10T10:00:00Z'));
    const status = getOpenStatus([hours({ day_of_week: 2 })], 'Europe/Warsaw');
    expect(status).toEqual({ state: 'open', until: '18:00' });
  });

  it('reports closed before opening time', () => {
    // 05:00 UTC → 07:00 in Warsaw, before the 09:00 open.
    jest.useFakeTimers().setSystemTime(new Date('2026-06-10T05:00:00Z'));
    const status = getOpenStatus([hours({ day_of_week: 2 })], 'Europe/Warsaw');
    expect(status).toEqual({ state: 'closed' });
  });

  it('reports closedToday when the salon does not open that weekday', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-10T10:00:00Z'));
    const status = getOpenStatus(
      [hours({ day_of_week: 2, is_closed: true })],
      'Europe/Warsaw',
    );
    expect(status).toEqual({ state: 'closedToday' });
  });
});
