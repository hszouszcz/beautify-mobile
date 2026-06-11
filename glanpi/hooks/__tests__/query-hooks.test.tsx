import { act, renderHook, waitFor } from '@testing-library/react-native';

import { renderHook as renderHookBare } from '@testing-library/react-native';

import {
  createAnonymousBooking,
  getAllServices,
  getBusinessHours,
  getCityFeed,
  getMyBookings,
  getPost,
  getPostBooking,
  getSalon,
  getStaff,
  queryKeys,
  tokenStorage,
} from '@/api';
import { useBusinessHours } from '@/hooks/use-business-hours';
import { useCity } from '@/hooks/use-city';
import { useCityFeed } from '@/hooks/use-city-feed';
import { useCreateAnonymousBooking } from '@/hooks/use-create-anonymous-booking';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useMyBookings } from '@/hooks/use-my-bookings';
import { usePost } from '@/hooks/use-post';
import { usePostBooking } from '@/hooks/use-post-booking';
import { useSalon } from '@/hooks/use-salon';
import { useSalonServices } from '@/hooks/use-salon-services';
import { useSalonStaff } from '@/hooks/use-salon-staff';
import { CityProvider } from '@/providers/city-provider';
import {
  createTestQueryClient,
  makeBusinessHours,
  makeSalon,
  makeService,
  makeStaff,
  renderHookWithProviders,
} from '@/test/utils';

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  getCityFeed: jest.fn(),
  getPost: jest.fn(),
  getPostBooking: jest.fn(),
  getSalon: jest.fn(),
  getBusinessHours: jest.fn(),
  getStaff: jest.fn(),
  getAllServices: jest.fn(),
  getMyBookings: jest.fn(),
  createAnonymousBooking: jest.fn(),
}));

const m = {
  cityFeed: getCityFeed as jest.Mock,
  post: getPost as jest.Mock,
  postBooking: getPostBooking as jest.Mock,
  salon: getSalon as jest.Mock,
  hours: getBusinessHours as jest.Mock,
  staff: getStaff as jest.Mock,
  services: getAllServices as jest.Mock,
  myBookings: getMyBookings as jest.Mock,
  createAnon: createAnonymousBooking as jest.Mock,
};

beforeEach(() => Object.values(m).forEach((fn) => fn.mockReset()));

describe('enabled gating', () => {
  it('useBusinessHours is disabled without a salon id', () => {
    const { result } = renderHookWithProviders(() => useBusinessHours(undefined));
    expect(result.current.fetchStatus).toBe('idle');
    expect(m.hours).not.toHaveBeenCalled();
  });

  it('useCityFeed is disabled for an empty city', () => {
    const { result } = renderHookWithProviders(() => useCityFeed(''));
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useSalon is disabled without an id', () => {
    const { result } = renderHookWithProviders(() => useSalon(undefined));
    expect(result.current.fetchStatus).toBe('idle');
    expect(m.salon).not.toHaveBeenCalled();
  });

  it('usePostBooking is disabled for an empty id', () => {
    const { result } = renderHookWithProviders(() => usePostBooking(''));
    expect(result.current.fetchStatus).toBe('idle');
    expect(m.postBooking).not.toHaveBeenCalled();
  });
});

describe('enabled fetches', () => {
  it('useSalon fetches by id', async () => {
    m.salon.mockResolvedValue(makeSalon({ id: 3 }));
    const { result } = renderHookWithProviders(() => useSalon(3));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(m.salon).toHaveBeenCalledWith(3);
  });

  it('useBusinessHours fetches when a salon id is present', async () => {
    m.hours.mockResolvedValue([makeBusinessHours({ salon: 5 })]);
    const { result } = renderHookWithProviders(() => useBusinessHours(5));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(m.hours).toHaveBeenCalledWith(5);
  });

  it('usePostBooking fetches when an id is present', async () => {
    m.postBooking.mockResolvedValue({ salon: { id: 1 } });
    const { result } = renderHookWithProviders(() => usePostBooking('p1'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(m.postBooking).toHaveBeenCalledWith('p1');
  });
});

describe('useCreateAnonymousBooking', () => {
  it('delegates to the anonymous-create endpoint', async () => {
    m.createAnon.mockResolvedValue({ booking: { id: 1 } });
    const { result } = renderHookWithProviders(() => useCreateAnonymousBooking());
    const body = {
      salon: 1, service: 2, staff: 3, start_time: 't',
      customer_name: 'Ada', customer_email: 'ada@test.com', customer_phone: '+48600700800',
    };
    await waitFor(async () => {
      await result.current.mutateAsync(body);
    });
    expect(m.createAnon).toHaveBeenCalledWith(body);
  });
});

describe('useCity', () => {
  it('throws outside a provider', () => {
    expect(() => renderHookBare(() => useCity())).toThrow(
      /must be used within a CityProvider/,
    );
  });

  it('exposes the city and a setter inside the provider', () => {
    const { result } = renderHookBare(() => useCity(), {
      wrapper: ({ children }) => <CityProvider>{children}</CityProvider>,
    });
    expect(typeof result.current.setCity).toBe('function');
    expect(result.current.city).toBeTruthy();
  });
});

describe('select transforms', () => {
  it('useSalonStaff keeps only active members', async () => {
    m.staff.mockResolvedValue([
      makeStaff({ id: 1, is_active: true }),
      makeStaff({ id: 2, is_active: false }),
    ]);
    const { result } = renderHookWithProviders(() => useSalonStaff(7));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((s) => s.id)).toEqual([1]);
  });

  it('useSalonServices keeps only this salon’s rows', async () => {
    m.services.mockResolvedValue([
      makeService({ id: 1, salon: 7 }),
      makeService({ id: 2, salon: 9 }),
    ]);
    const { result } = renderHookWithProviders(() => useSalonServices(7));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((s) => s.id)).toEqual([1]);
  });
});

describe('useCityFeed pagination', () => {
  it('stops paging when `next` is null', async () => {
    m.cityFeed.mockResolvedValue({
      city: 'Warsaw',
      post_type: null,
      total_posts: 0,
      results: [],
      next: null,
    });
    const { result } = renderHookWithProviders(() => useCityFeed('Warsaw'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });
});

describe('usePost warm cache', () => {
  it('uses a feed-cached post as initialData', async () => {
    const queryClient = createTestQueryClient();
    const cached = { id: 'p1', title: 'Warm' };
    queryClient.setQueryData(queryKeys.feed.city('Warsaw'), {
      pages: [{ city: 'Warsaw', post_type: null, total_posts: 1, results: [cached] }],
      pageParams: [1],
    });
    m.post.mockResolvedValue({ id: 'p1', title: 'Fresh' });

    const { result } = renderHookWithProviders(() => usePost('p1'), { queryClient });
    // initialData paints immediately from the feed cache.
    expect(result.current.data?.title).toBe('Warm');
  });
});

describe('useMyBookings auth gating', () => {
  it('is disabled while unauthenticated', async () => {
    await tokenStorage.clearTokens();
    const { result } = renderHookWithProviders(() => useMyBookings());
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches once authenticated', async () => {
    await tokenStorage.setTokens({ access: 'a', refresh: 'r' });
    m.myBookings.mockResolvedValue([]);
    const { result } = renderHookWithProviders(() => useMyBookings());
    await waitFor(() => expect(m.myBookings).toHaveBeenCalled());
    await tokenStorage.clearTokens();
    expect(result.current).toBeDefined();
  });
});

describe('useDebouncedValue', () => {
  afterEach(() => jest.useRealTimers());

  it('updates only after the quiet window', () => {
    jest.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ v }: { v: string }) => useDebouncedValue(v, 300),
      { initialProps: { v: 'a' } },
    );
    expect(result.current).toBe('a');

    rerender({ v: 'ab' });
    expect(result.current).toBe('a'); // not yet

    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('ab');
  });
});
