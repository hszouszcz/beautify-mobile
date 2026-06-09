import { useQuery } from '@tanstack/react-query';

import { getStaff, queryKeys, type ApiError, type Staff } from '@/api';

/** Active staff for one salon (the endpoint filters/falls back client-side). */
export function useSalonStaff(salonId: number | string | undefined) {
  return useQuery<Staff[], ApiError>({
    queryKey: queryKeys.salons.staff(salonId ?? ''),
    queryFn: () => getStaff(salonId!),
    enabled: salonId != null && salonId !== '',
    staleTime: 5 * 60_000,
    select: (all) => all.filter((s) => s.is_active),
  });
}
