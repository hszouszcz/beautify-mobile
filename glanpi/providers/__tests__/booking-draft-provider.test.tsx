import { act, renderHook } from '@testing-library/react-native';

import {
  BookingDraftProvider,
  useBookingDraft,
} from '@/providers/booking-draft-provider';
import { makeService, makeSlotOption } from '@/test/utils';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BookingDraftProvider>{children}</BookingDraftProvider>
);

describe('BookingDraftProvider', () => {
  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useBookingDraft())).toThrow(
      /must be used within a BookingDraftProvider/,
    );
  });

  it('starts empty and accumulates partial updates across steps', () => {
    const { result } = renderHook(() => useBookingDraft(), { wrapper });
    expect(result.current.draft).toEqual({});

    const service = makeService();
    act(() => result.current.set({ salonId: 1, service }));
    act(() => result.current.set({ staffId: 3, date: '2026-06-12' }));

    expect(result.current.draft.salonId).toBe(1);
    expect(result.current.draft.service).toBe(service);
    expect(result.current.draft.staffId).toBe(3);
    expect(result.current.draft.date).toBe('2026-06-12');
  });

  it('merges (does not replace) on subsequent set calls', () => {
    const { result } = renderHook(() => useBookingDraft(), { wrapper });
    const slot = makeSlotOption();
    act(() => result.current.set({ salonId: 1 }));
    act(() => result.current.set({ slot }));
    expect(result.current.draft.salonId).toBe(1);
    expect(result.current.draft.slot).toBe(slot);
  });

  it('reset clears the whole draft', () => {
    const { result } = renderHook(() => useBookingDraft(), { wrapper });
    act(() => result.current.set({ salonId: 1, date: '2026-06-12' }));
    act(() => result.current.reset());
    expect(result.current.draft).toEqual({});
  });
});
