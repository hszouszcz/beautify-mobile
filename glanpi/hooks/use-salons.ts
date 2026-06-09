import { useInfiniteQuery } from '@tanstack/react-query';

import {
  getSalons,
  queryKeys,
  type ApiError,
  type Paginated,
  type Salon,
} from '@/api';
import type { SalonFilters } from '@/providers/find-filters-provider';

/**
 * City-scoped salon list (PUBLIC), paginated for infinite scroll — the Find
 * tab's primary data source. Mirrors `use-city-feed`: advance the page number
 * while the DRF envelope's `next` URL is non-null.
 *
 * `filters` (date/time availability) are folded into the query key and passed
 * through as query params. They take effect once the backend availability-search
 * endpoint ships (see `docs/find-filters-backend-spec.md`); until then unknown
 * params are ignored server-side.
 */
export function useSalons(city: string, filters: SalonFilters = {}) {
  const params = {
    available_from_date: filters.dateFrom,
    available_to_date: filters.dateTo,
    available_from_time: filters.timeFrom,
    available_to_time: filters.timeTo,
  };

  return useInfiniteQuery<Paginated<Salon>, ApiError>({
    queryKey: queryKeys.salons.list(city, params),
    queryFn: ({ pageParam }) =>
      getSalons({
        city,
        page: pageParam as number,
        availableFromDate: filters.dateFrom,
        availableToDate: filters.dateTo,
        availableFromTime: filters.timeFrom,
        availableToTime: filters.timeTo,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
    enabled: city.length > 0,
  });
}
