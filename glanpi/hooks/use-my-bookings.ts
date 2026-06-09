import { useQuery } from '@tanstack/react-query';

import { getMyBookings, queryKeys, type ApiError, type Booking } from '@/api';

import { useAuth } from './use-auth';

/**
 * The authenticated user's bookings — the seam for the Calendar "My bookings"
 * feature (a separate deliverable). Disabled while unauthenticated.
 */
export function useMyBookings() {
  const { status } = useAuth();
  return useQuery<Booking[], ApiError>({
    queryKey: queryKeys.bookings.mine(),
    queryFn: getMyBookings,
    enabled: status === 'authenticated',
  });
}
