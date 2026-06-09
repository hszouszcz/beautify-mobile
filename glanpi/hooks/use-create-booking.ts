import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createBooking,
  queryKeys,
  type ApiError,
  type CreateBookingRequest,
  type CreateBookingResponse,
} from '@/api';

/**
 * Create a booking for the authenticated user (`POST /bookings/`). The primary
 * create path (design D1). Invalidates "My bookings" so the Calendar handoff is
 * fresh.
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation<CreateBookingResponse, ApiError, CreateBookingRequest>({
    mutationFn: (body) => createBooking(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine() });
    },
  });
}
