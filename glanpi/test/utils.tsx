/**
 * Shared test utilities: a provider wrapper that mirrors the app stack, a test
 * QueryClient, and type-safe domain factories. See the testing plan, Part A4.
 *
 * Hook/integration tests mock the thin `api/endpoints/*` functions (via
 * `jest.mock('@/api')`) rather than the network, so these helpers only wire the
 * React context providers the hooks/screens read from.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, type RenderOptions } from '@testing-library/react-native';
import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type {
  AvailabilityResponse,
  Booking,
  BusinessHours,
  Salon,
  SalonService,
  SlotOption,
  Staff,
  User,
} from '@/api';
import i18n from '@/i18n';
import { glanpiLightTheme } from '@/theme';
import { AuthProvider } from '@/providers/auth-provider';
import {
  BookingDraftProvider,
  useBookingDraft,
  type BookingDraft,
} from '@/providers/booking-draft-provider';
import { CityProvider } from '@/providers/city-provider';
import { FindFiltersProvider } from '@/providers/find-filters-provider';

/** QueryClient tuned for tests: no retries, no caching between tests, quiet logs. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

type WrapperOptions = {
  queryClient?: QueryClient;
  /** Mount the booking-draft provider (only the booking flow needs it). */
  withBookingDraft?: boolean;
};

/** App-equivalent provider stack for rendering screens/hooks under test. */
export function AllProviders({
  children,
  queryClient,
  withBookingDraft,
}: WrapperOptions & { children: ReactNode }) {
  const client = queryClient ?? createTestQueryClient();
  const tree = (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <PaperProvider theme={glanpiLightTheme}>
            <AuthProvider>
              <CityProvider>
                <FindFiltersProvider>{children}</FindFiltersProvider>
              </CityProvider>
            </AuthProvider>
          </PaperProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
  return withBookingDraft ? <BookingDraftProvider>{tree}</BookingDraftProvider> : tree;
}

/** `render` with the full provider stack. Returns the test QueryClient too. */
export function renderWithProviders(
  ui: ReactElement,
  options: WrapperOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { queryClient = createTestQueryClient(), withBookingDraft, ...rest } = options;
  const utils = render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient} withBookingDraft={withBookingDraft}>
        {children}
      </AllProviders>
    ),
    ...rest,
  });
  return { ...utils, queryClient };
}

/** Seeds the booking draft once on mount (booking screens read from it). */
function DraftSeeder({ draft, children }: { draft?: BookingDraft; children: ReactNode }) {
  const { set } = useBookingDraft();
  const seeded = useRef(false);
  useEffect(() => {
    if (draft && !seeded.current) {
      seeded.current = true;
      set(draft);
    }
  }, [draft, set]);
  return <>{children}</>;
}

/**
 * Render a booking-flow screen with the draft pre-seeded. The draft is applied
 * in an effect, so assert with `findBy*`/`waitFor` (screens render empty first).
 */
export function renderBookingScreen(
  ui: ReactElement,
  options: { draft?: BookingDraft; queryClient?: QueryClient } = {},
) {
  const { draft, queryClient = createTestQueryClient() } = options;
  return renderWithProviders(<DraftSeeder draft={draft}>{ui}</DraftSeeder>, {
    queryClient,
    withBookingDraft: true,
  });
}

/** `renderHook` with the full provider stack. Returns the test QueryClient too. */
export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  options: WrapperOptions = {},
) {
  const { queryClient = createTestQueryClient(), withBookingDraft } = options;
  const utils = renderHook(hook, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient} withBookingDraft={withBookingDraft}>
        {children}
      </AllProviders>
    ),
  });
  return { ...utils, queryClient };
}

// --- Domain factories -------------------------------------------------------
// Type-safe builders so fixtures track `api/types.ts`. Each takes an override.

let seq = 0;
const nextId = () => ++seq;

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: String(nextId()),
    phone: '+48600700800',
    phone_verified: true,
    email: null,
    first_name: 'Ada',
    last_name: 'Kowalska',
    role: 'customer',
    ...overrides,
  };
}

export function makeSalon(overrides: Partial<Salon> = {}): Salon {
  return {
    id: nextId(),
    name: 'Studio Glanc',
    description: '',
    address: 'ul. Piękna 1',
    city: 'Warsaw',
    postal_code: '00-001',
    phone: '+48221234567',
    email: null,
    website: null,
    timezone: 'Europe/Warsaw',
    latitude: 52.23,
    longitude: 21.01,
    avg_rating: '4.5',
    review_count: 12,
    is_active: true,
    ...overrides,
  };
}

export function makeService(overrides: Partial<SalonService> = {}): SalonService {
  return {
    id: nextId(),
    salon: 1,
    name: 'Strzyżenie',
    duration_minutes: 45,
    price_display: '180.00',
    ...overrides,
  };
}

export function makeStaff(overrides: Partial<Staff> = {}): Staff {
  return {
    id: nextId(),
    salon: 1,
    display_name: 'Marta',
    services: [],
    is_active: true,
    ...overrides,
  };
}

export function makeBusinessHours(overrides: Partial<BusinessHours> = {}): BusinessHours {
  return {
    id: nextId(),
    salon: 1,
    day_of_week: 0,
    day_name: 'Poniedziałek',
    open_time: '09:00:00',
    close_time: '18:00:00',
    is_closed: false,
    ...overrides,
  };
}

export function makeSlotOption(overrides: Partial<SlotOption> = {}): SlotOption {
  return {
    slot_ids: [nextId()],
    start_datetime: '2026-06-12T07:00:00Z',
    end_datetime: '2026-06-12T07:45:00Z',
    display: { start_time: '09:00:00', end_time: '09:45:00' },
    ...overrides,
  };
}

export function makeAvailability(
  overrides: Partial<AvailabilityResponse> = {},
): AvailabilityResponse {
  const slots = overrides.slot_options ?? [makeSlotOption()];
  return {
    salon: '1',
    service: '1',
    staff: '1',
    date: '2026-06-12',
    slot_options: slots,
    total_options: slots.length,
    ...overrides,
  };
}

export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: nextId(),
    salon: { id: 1, name: 'Studio Glanc', address: 'ul. Piękna 1', timezone: 'Europe/Warsaw' },
    service: { id: 1, name: 'Strzyżenie', duration_minutes: 45, price_display: '180.00' },
    staff: { id: 1, display_name: 'Marta' },
    start_time: '2026-06-12T07:00:00Z',
    end_time: '2026-06-12T07:45:00Z',
    status: 'CONFIRMED',
    customer_name: 'Ada Kowalska',
    created_at: '2026-06-10T12:00:00Z',
    ...overrides,
  };
}
