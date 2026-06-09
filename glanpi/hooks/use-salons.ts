import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import {
  getSalons,
  queryKeys,
  type ApiError,
  type Paginated,
  type Salon,
} from '@/api';
import type { SalonFilters } from '@/providers/find-filters-provider';

/** Optional geo-radius scope (all three move together). */
export type SalonsGeo = { lat: number; lng: number; radiusKm: number };

/**
 * City-scoped salon list (PUBLIC), paginated for infinite scroll — the Find
 * tab's primary data source. Mirrors `use-city-feed`: advance the page number
 * while the DRF envelope's `next` URL is non-null.
 *
 * `search` drives the server-side `q` filter (salon name, address, and active
 * service names — see `MOBILE_FIND_FILTERS.md`); pass it already debounced since
 * each distinct value is a fresh server query. `filters` (date/time availability)
 * and the optional `geo` scope are likewise folded into the query key and sent as
 * query params, so the list refetches whenever any of them change.
 */
export function useSalons(
  city: string,
  filters: SalonFilters = {},
  search = '',
  geo?: SalonsGeo,
) {
  const q = search.trim() || undefined;
  // Serialized into the query key so the list refetches when any input changes.
  const params = {
    q,
    available_from_date: filters.dateFrom,
    available_to_date: filters.dateTo,
    available_from_time: filters.timeFrom,
    available_to_time: filters.timeTo,
    lat: geo ? String(geo.lat) : undefined,
    lng: geo ? String(geo.lng) : undefined,
    radius_km: geo ? String(geo.radiusKm) : undefined,
  };

  return useInfiniteQuery<Paginated<Salon>, ApiError>({
    queryKey: queryKeys.salons.list(city, params),
    queryFn: ({ pageParam }) =>
      getSalons({
        city,
        page: pageParam as number,
        q,
        availableFromDate: filters.dateFrom,
        availableToDate: filters.dateTo,
        availableFromTime: filters.timeFrom,
        availableToTime: filters.timeTo,
        lat: geo?.lat,
        lng: geo?.lng,
        radiusKm: geo?.radiusKm,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
    // Keep the current results on screen while a new search/filter query loads,
    // so each debounced keystroke doesn't flash the full-screen spinner.
    placeholderData: keepPreviousData,
    enabled: city.length > 0,
  });
}
