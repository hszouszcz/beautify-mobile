import { useInfiniteQuery } from '@tanstack/react-query';

import {
  getSalons,
  queryKeys,
  type ApiError,
  type Paginated,
  type Salon,
} from '@/api';

/**
 * City-scoped salon list (PUBLIC), paginated for infinite scroll — the Find
 * tab's primary data source. Mirrors `use-city-feed`: advance the page number
 * while the DRF envelope's `next` URL is non-null.
 */
export function useSalons(city: string) {
  return useInfiniteQuery<Paginated<Salon>, ApiError>({
    queryKey: queryKeys.salons.city(city),
    queryFn: ({ pageParam }) => getSalons({ city, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
    enabled: city.length > 0,
  });
}
