import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Availability filters for the Find tab. Date is the salon's local calendar day
 * (YYYY-MM-DD); time is a wall-clock window (HH:mm) within each day of the
 * range. All fields are optional and independent: a date range with no time
 * means "any time that day", a time range with no date means "any day, this
 * time window".
 *
 * NOTE: applying these to results needs the backend availability-search
 * endpoint (see `docs/find-filters-backend-spec.md`). They are threaded through
 * `useSalons` → `getSalons` as query params today; until the endpoint ships the
 * backend ignores them and the list is unchanged. The UI is fully built so it
 * "just works" the moment the endpoint lands — no client changes needed.
 */
export type SalonFilters = {
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD (inclusive; equals dateFrom for a single day)
  timeFrom?: string; // HH:mm
  timeTo?: string; // HH:mm
};

/** How many distinct filter facets are set — drives the trigger's count badge. */
export function countActiveFilters(f: SalonFilters): number {
  let n = 0;
  if (f.dateFrom) n += 1; // date range counts as one facet
  if (f.timeFrom || f.timeTo) n += 1; // time range counts as one facet
  return n;
}

export type FindFiltersContextValue = {
  filters: SalonFilters;
  setFilters: (next: SalonFilters) => void;
  clear: () => void;
  activeCount: number;
};

const FindFiltersContext = createContext<FindFiltersContextValue | null>(null);

export function FindFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<SalonFilters>({});

  const setFilters = useCallback((next: SalonFilters) => setFiltersState(next), []);
  const clear = useCallback(() => setFiltersState({}), []);

  const value = useMemo<FindFiltersContextValue>(
    () => ({ filters, setFilters, clear, activeCount: countActiveFilters(filters) }),
    [filters, setFilters, clear],
  );

  return <FindFiltersContext.Provider value={value}>{children}</FindFiltersContext.Provider>;
}

/** Access the Find availability filters. Must be used inside a provider. */
export function useFindFilters(): FindFiltersContextValue {
  const ctx = useContext(FindFiltersContext);
  if (!ctx) {
    throw new Error('useFindFilters must be used within a FindFiltersProvider');
  }
  return ctx;
}
