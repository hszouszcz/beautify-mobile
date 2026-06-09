import { useQuery } from '@tanstack/react-query';

import {
  getAvailability,
  queryKeys,
  type ApiError,
  type AvailabilityResponse,
} from '@/api';

export type UseAvailabilityArgs = {
  salon: number | string | undefined;
  service: number | string | undefined;
  staff: number | string | undefined;
  date: string | undefined; // YYYY-MM-DD
};

/**
 * Slot options for a (salon, service, staff, date) tuple. Keyed per tuple, so
 * changing staff or date re-keys → React Query refetches and caches each combo.
 * `enabled` only when all four are present. Short `staleTime` — availability is
 * volatile.
 */
export function useAvailability({ salon, service, staff, date }: UseAvailabilityArgs) {
  const ready = salon != null && service != null && staff != null && !!date;

  return useQuery<AvailabilityResponse, ApiError>({
    queryKey: queryKeys.bookings.availability(salon ?? '', service ?? '', staff ?? '', date ?? ''),
    queryFn: () => getAvailability({ salon: salon!, service: service!, staff: staff!, date: date! }),
    enabled: ready,
    staleTime: 30_000,
  });
}
