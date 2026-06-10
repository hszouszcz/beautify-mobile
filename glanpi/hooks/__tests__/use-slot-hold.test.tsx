import { act, waitFor } from '@testing-library/react-native';

import { createSlotHold } from '@/api';
import { useSlotHold } from '@/hooks/use-slot-hold';
import { renderHookWithProviders } from '@/test/utils';

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  createSlotHold: jest.fn(),
}));

const mockCreateSlotHold = createSlotHold as jest.MockedFunction<typeof createSlotHold>;
const { ApiError } = jest.requireActual('@/api') as typeof import('@/api');

describe('useSlotHold', () => {
  beforeEach(() => mockCreateSlotHold.mockReset());

  it('returns the hold on success', async () => {
    mockCreateSlotHold.mockResolvedValue({
      hold_id: 'h1',
      expires_at: '2026-06-12T07:05:00Z',
    });
    const { result } = renderHookWithProviders(() => useSlotHold());

    let hold;
    await act(async () => {
      hold = await result.current.mutateAsync([1, 2]);
    });

    expect(hold).toMatchObject({ hold_id: 'h1' });
    expect(mockCreateSlotHold).toHaveBeenCalledWith([1, 2]);
  });

  it('reports failure as a (non-fatal) error the caller can ignore', async () => {
    mockCreateSlotHold.mockRejectedValue(new ApiError({ status: 500, message: 'nope' }));
    const { result } = renderHookWithProviders(() => useSlotHold());

    await act(async () => {
      await expect(result.current.mutateAsync([1])).rejects.toBeInstanceOf(ApiError);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
