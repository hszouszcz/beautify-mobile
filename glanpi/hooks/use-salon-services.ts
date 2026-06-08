import { useQuery } from '@tanstack/react-query';

import { getAllServices, queryKeys, type ApiError, type SalonService } from '@/api';

/**
 * Services for one salon. The backend ignores `?salon=`, so we fetch the full
 * list once (shared query key, fetched a single time for the whole screen) and
 * `select` this salon's rows client-side. Each card observes the same cache.
 */
export function useSalonServices(salonId: number) {
  return useQuery<SalonService[], ApiError, SalonService[]>({
    queryKey: queryKeys.salons.services(),
    queryFn: getAllServices,
    staleTime: 5 * 60_000,
    select: (all) => all.filter((s) => s.salon === salonId),
  });
}
