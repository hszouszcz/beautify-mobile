import { waitFor } from '@testing-library/react-native';

import { getAvailability } from '@/api';
import { useAvailability } from '@/hooks/use-availability';
import { makeAvailability, renderHookWithProviders } from '@/test/utils';

// Mock only the endpoint; queryKeys/types stay real.
jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  getAvailability: jest.fn(),
}));

const mockGetAvailability = getAvailability as jest.MockedFunction<typeof getAvailability>;

describe('useAvailability', () => {
  beforeEach(() => mockGetAvailability.mockReset());

  it('stays disabled until all four params are present', async () => {
    const { result } = renderHookWithProviders(() =>
      useAvailability({ salon: 1, service: 2, staff: 3, date: undefined }),
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetAvailability).not.toHaveBeenCalled();
  });

  it('fetches and returns slot options once the tuple is complete', async () => {
    const availability = makeAvailability();
    mockGetAvailability.mockResolvedValue(availability);

    const { result } = renderHookWithProviders(() =>
      useAvailability({ salon: 1, service: 2, staff: 3, date: '2026-06-12' }),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(availability);
    expect(mockGetAvailability).toHaveBeenCalledWith({
      salon: 1,
      service: 2,
      staff: 3,
      date: '2026-06-12',
    });
  });

  it('surfaces the ApiError on failure', async () => {
    const { ApiError } = jest.requireActual('@/api') as typeof import('@/api');
    mockGetAvailability.mockRejectedValue(new ApiError({ status: 500, message: 'boom' }));

    const { result } = renderHookWithProviders(() =>
      useAvailability({ salon: 1, service: 2, staff: 3, date: '2026-06-12' }),
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.status).toBe(500);
  });
});
