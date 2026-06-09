import { useMutation } from '@tanstack/react-query';

import { createSlotHold, type ApiError, type SlotHold } from '@/api';

/**
 * Create a 5-min slot hold during the SMS window. Advisory: the create-failure
 * handler is the authoritative safety net (design D3), so a hold failure is not
 * fatal — callers continue without it.
 */
export function useSlotHold() {
  return useMutation<SlotHold, ApiError, (number | string)[]>({
    mutationFn: (slotIds) => createSlotHold(slotIds),
  });
}
