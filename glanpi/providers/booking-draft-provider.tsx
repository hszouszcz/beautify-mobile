import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { BookingServiceLite, Booking, SlotHold, SlotOption } from '@/api';

/**
 * Cross-step booking state. Scoped to the booking modal (mounted in
 * `app/booking/_layout.tsx`), so it resets when the flow closes. Route params
 * only carry the entry seed (`salonId`, optional `serviceId`/`postId`);
 * everything chosen mid-flow lives here — this avoids threading complex objects
 * (the `SlotOption`) through navigation params (plan §7).
 */
export type BookingDraft = {
  salonId?: number | string;
  postId?: string;
  salonName?: string;
  salonAddress?: string;
  timezone?: string;
  cancellationNoticeHours?: number;
  service?: BookingServiceLite; // chosen service (price merged in — G3)
  staffId?: number | string;
  staffName?: string;
  date?: string; // YYYY-MM-DD
  slot?: SlotOption; // chosen option (start_datetime → start_time)
  hold?: SlotHold;
  name?: { first: string; last: string };
  phone?: string; // E.164
  phoneHint?: string;
  resendWaitSeconds?: number;
  createdBooking?: Booking; // set after POST; Confirmation reads this
};

export type BookingDraftContextValue = {
  draft: BookingDraft;
  set: (partial: Partial<BookingDraft>) => void;
  reset: () => void;
};

const BookingDraftContext = createContext<BookingDraftContextValue | null>(null);

export function BookingDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>({});

  const set = useCallback((partial: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => setDraft({}), []);

  const value = useMemo<BookingDraftContextValue>(
    () => ({ draft, set, reset }),
    [draft, set, reset],
  );

  return (
    <BookingDraftContext.Provider value={value}>{children}</BookingDraftContext.Provider>
  );
}

/** Access the booking draft. Must be used inside a `BookingDraftProvider`. */
export function useBookingDraft(): BookingDraftContextValue {
  const ctx = useContext(BookingDraftContext);
  if (!ctx) {
    throw new Error('useBookingDraft must be used within a BookingDraftProvider');
  }
  return ctx;
}
