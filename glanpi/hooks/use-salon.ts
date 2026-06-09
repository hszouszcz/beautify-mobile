import { useQuery } from '@tanstack/react-query';

import { getSalon, queryKeys, type ApiError, type Salon } from '@/api';

/**
 * Single salon identity. Used by Salon Detail and to enrich the Post Detail
 * salon strip (rating) while warming the cache for the post→salon hop (plan
 * §8.6). Disabled until an id is known.
 */
export function useSalon(id: number | string | undefined) {
  return useQuery<Salon, ApiError>({
    queryKey: queryKeys.salons.detail(id ?? ''),
    queryFn: () => getSalon(id!),
    enabled: id != null && id !== '',
    staleTime: 5 * 60_000,
  });
}
