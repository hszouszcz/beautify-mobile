import { useMutation } from '@tanstack/react-query';

import {
  createAnonymousBooking,
  type ApiError,
  type CreateAnonymousBookingRequest,
  type CreateBookingResponse,
} from '@/api';

/**
 * Anonymous booking fallback (design D1). The authenticated path is primary;
 * this exists for parity with the documented endpoint and is not wired into the
 * happy path.
 */
export function useCreateAnonymousBooking() {
  return useMutation<CreateBookingResponse, ApiError, CreateAnonymousBookingRequest>({
    mutationFn: (body) => createAnonymousBooking(body),
  });
}
