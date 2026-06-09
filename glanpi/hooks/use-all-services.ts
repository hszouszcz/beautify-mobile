import { useQuery } from '@tanstack/react-query';

import { getAllServices, queryKeys, type ApiError, type SalonService } from '@/api';

/**
 * All services in one fetch (shared cache key with `use-salon-services`, so the
 * Find screen and its cards observe the same query). Used at the screen level to
 * filter salons by the names of services they offer — the salon list endpoint
 * carries no services, so service-name search has to join against this list
 * client-side.
 */
export function useAllServices() {
  return useQuery<SalonService[], ApiError>({
    queryKey: queryKeys.salons.services(),
    queryFn: getAllServices,
    staleTime: 5 * 60_000,
  });
}
