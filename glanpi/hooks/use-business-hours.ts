import { useQuery } from '@tanstack/react-query';

import {
  getBusinessHours,
  queryKeys,
  type ApiError,
  type BusinessHours,
} from '@/api';

/** Business hours for one salon — drives closed-day disabling + open-now. */
export function useBusinessHours(salonId: number | string | undefined) {
  return useQuery<BusinessHours[], ApiError>({
    queryKey: queryKeys.salons.hours(salonId ?? ''),
    queryFn: () => getBusinessHours(salonId!),
    enabled: salonId != null && salonId !== '',
    staleTime: 5 * 60_000,
  });
}
