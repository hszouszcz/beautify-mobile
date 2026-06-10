import { act, renderHook } from '@testing-library/react-native';

import {
  countActiveFilters,
  FindFiltersProvider,
  useFindFilters,
  type SalonFilters,
} from '@/providers/find-filters-provider';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <FindFiltersProvider>{children}</FindFiltersProvider>
);

describe('countActiveFilters', () => {
  it('counts a date range as one facet', () => {
    expect(countActiveFilters({ dateFrom: '2026-06-12' })).toBe(1);
  });

  it('counts any part of a time range as one facet', () => {
    expect(countActiveFilters({ timeFrom: '09:00' })).toBe(1);
    expect(countActiveFilters({ timeTo: '17:00' })).toBe(1);
    expect(countActiveFilters({ timeFrom: '09:00', timeTo: '17:00' })).toBe(1);
  });

  it('sums date and time facets', () => {
    const f: SalonFilters = { dateFrom: '2026-06-12', timeFrom: '09:00' };
    expect(countActiveFilters(f)).toBe(2);
  });

  it('returns zero for an empty filter set', () => {
    expect(countActiveFilters({})).toBe(0);
  });
});

describe('FindFiltersProvider', () => {
  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useFindFilters())).toThrow(
      /must be used within a FindFiltersProvider/,
    );
  });

  it('sets filters and recomputes the active count', () => {
    const { result } = renderHook(() => useFindFilters(), { wrapper });
    expect(result.current.activeCount).toBe(0);

    act(() => result.current.setFilters({ dateFrom: '2026-06-12', timeFrom: '09:00' }));

    expect(result.current.filters.dateFrom).toBe('2026-06-12');
    expect(result.current.activeCount).toBe(2);
  });

  it('clears filters back to empty', () => {
    const { result } = renderHook(() => useFindFilters(), { wrapper });
    act(() => result.current.setFilters({ dateFrom: '2026-06-12' }));
    act(() => result.current.clear());
    expect(result.current.filters).toEqual({});
    expect(result.current.activeCount).toBe(0);
  });
});
