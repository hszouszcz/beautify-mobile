import { act, waitFor } from '@testing-library/react-native';

import { getSalons, type Paginated, type Salon } from '@/api';
import { useSalons } from '@/hooks/use-salons';
import { makeSalon, renderHookWithProviders } from '@/test/utils';

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  getSalons: jest.fn(),
}));

const mockGetSalons = getSalons as jest.MockedFunction<typeof getSalons>;

function page(results: Salon[], next: string | null): Paginated<Salon> {
  return { count: results.length, next, previous: null, results };
}

describe('useSalons', () => {
  beforeEach(() => mockGetSalons.mockReset());

  it('is disabled for an empty city', () => {
    const { result } = renderHookWithProviders(() => useSalons(''));
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetSalons).not.toHaveBeenCalled();
  });

  it('loads the first city page and forwards the trimmed search + filters', async () => {
    mockGetSalons.mockResolvedValue(page([makeSalon({ name: 'A' })], null));

    const { result } = renderHookWithProviders(() =>
      useSalons('Warsaw', { dateFrom: '2026-06-12', timeFrom: '09:00' }, '  hair  '),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetSalons).toHaveBeenCalledWith(
      expect.objectContaining({
        city: 'Warsaw',
        page: 1,
        q: 'hair',
        availableFromDate: '2026-06-12',
        availableFromTime: '09:00',
      }),
    );
  });

  it('paginates while `next` is present', async () => {
    mockGetSalons
      .mockResolvedValueOnce(page([makeSalon({ name: 'A' })], 'http://api/?page=2'))
      .mockResolvedValueOnce(page([makeSalon({ name: 'B' })], null));

    const { result } = renderHookWithProviders(() => useSalons('Warsaw'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(mockGetSalons).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(result.current.hasNextPage).toBe(false);
  });
});
