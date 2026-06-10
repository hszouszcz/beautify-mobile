import { queryKeys } from '@/api/query-keys';

describe('queryKeys', () => {
  it('builds stable, structured keys', () => {
    expect(queryKeys.me()).toEqual(['me']);
    expect(queryKeys.feed.city('Warsaw', 'hair')).toEqual([
      'feed',
      'city',
      'Warsaw',
      'hair',
    ]);
    expect(queryKeys.feed.city('Warsaw')).toEqual(['feed', 'city', 'Warsaw', null]);
  });

  it('encodes salon filters so the key changes when filters change', () => {
    const a = queryKeys.salons.list('Warsaw', { dateFrom: '2026-06-12' });
    const b = queryKeys.salons.list('Warsaw', { dateFrom: '2026-06-13' });
    expect(a).not.toEqual(b);
  });

  it('keys availability by the full (salon, service, staff, date) tuple', () => {
    expect(queryKeys.bookings.availability(1, 2, 3, '2026-06-12')).toEqual([
      'bookings',
      'availability',
      1,
      2,
      3,
      '2026-06-12',
    ]);
  });

  it('shares one services key (backend ignores ?salon=)', () => {
    expect(queryKeys.salons.services()).toEqual(['salons', 'services', 'all']);
  });
});
