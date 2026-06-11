import { act, waitFor } from '@testing-library/react-native';

import { createBooking, queryKeys } from '@/api';
import { useCreateBooking } from '@/hooks/use-create-booking';
import { makeBooking, renderHookWithProviders } from '@/test/utils';

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  createBooking: jest.fn(),
}));

const mockCreateBooking = createBooking as jest.MockedFunction<typeof createBooking>;
const { ApiError } = jest.requireActual('@/api') as typeof import('@/api');

const body = { salon: 1, service: 2, staff: 3, start_time: '2026-06-12T07:00:00Z' };

describe('useCreateBooking', () => {
  beforeEach(() => mockCreateBooking.mockReset());

  it('invalidates "my bookings" after a successful create', async () => {
    mockCreateBooking.mockResolvedValue(makeBooking());
    const { result, queryClient } = renderHookWithProviders(() => useCreateBooking());
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      await result.current.mutateAsync(body);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.bookings.mine() });
  });

  it('surfaces a 409 conflict as an ApiError (slot race)', async () => {
    mockCreateBooking.mockRejectedValue(new ApiError({ status: 409, message: 'taken' }));
    const { result } = renderHookWithProviders(() => useCreateBooking());

    await act(async () => {
      await expect(result.current.mutateAsync(body)).rejects.toBeInstanceOf(ApiError);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.status).toBe(409);
  });
});
