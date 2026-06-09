import { useQuery } from '@tanstack/react-query';

import { getPostBooking, queryKeys, type ApiError, type PostBooking } from '@/api';

/**
 * Tap-to-book payload for a post: salon, services, staff, featured service.
 * Drives the booking flow's service/staff lists and the canonical salon id.
 */
export function usePostBooking(id: string) {
  return useQuery<PostBooking, ApiError>({
    queryKey: queryKeys.posts.booking(id),
    queryFn: () => getPostBooking(id),
    enabled: id.length > 0,
    staleTime: 60_000,
  });
}
