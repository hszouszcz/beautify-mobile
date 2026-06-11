import { Alert } from 'react-native';

import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createBooking } from '@/api';
import BookingReviewScreen from '@/app/booking/review';
import {
  makeBooking,
  makeService,
  makeSlotOption,
  renderBookingScreen,
} from '@/test/utils';

const mockRouter = { replace: jest.fn(), dismissAll: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

// Authenticated user with a name on file (so Review doesn't bounce to Details).
jest.mock('@/hooks/use-me', () => ({
  useMe: () => ({
    data: { id: '1', first_name: 'Ada', last_name: 'Kowalska', phone: '+48600700800' },
  }),
}));

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  createBooking: jest.fn(),
}));
const mockCreateBooking = createBooking as jest.MockedFunction<typeof createBooking>;
const { ApiError } = jest.requireActual('@/api') as typeof import('@/api');

const draft = {
  salonId: 1,
  salonName: 'Studio Glanc',
  service: makeService({ id: 7 }),
  staffId: 3,
  staffName: 'Marta',
  slot: makeSlotOption(),
  date: '2026-06-12',
};

describe('BookingReviewScreen', () => {
  beforeEach(() => {
    mockCreateBooking.mockReset();
    mockRouter.replace.mockReset();
  });

  it('creates the booking and advances to confirmation', async () => {
    mockCreateBooking.mockResolvedValue(makeBooking({ status: 'confirmed' }));
    renderBookingScreen(<BookingReviewScreen />, { draft });

    fireEvent.press(await screen.findByTestId('booking-review-confirm'));

    await waitFor(() =>
      expect(mockCreateBooking).toHaveBeenCalledWith({
        salon: 1,
        service: 7,
        staff: 3,
        start_time: draft.slot.start_datetime,
        end_time: draft.slot.end_datetime,
      }),
    );
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith('/booking/confirmation'),
    );
  });

  it('recovers to Schedule when the slot was taken (409)', async () => {
    mockCreateBooking.mockRejectedValue(new ApiError({ status: 409, message: 'slot taken' }));
    renderBookingScreen(<BookingReviewScreen />, { draft });

    fireEvent.press(await screen.findByTestId('booking-review-confirm'));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith('/booking/schedule'),
    );
  });

  it('shows the limit error inline when the user is at their booking cap', async () => {
    mockCreateBooking.mockRejectedValue(
      new ApiError({ status: 409, message: 'maksymalna — limit reached' }),
    );
    renderBookingScreen(<BookingReviewScreen />, { draft });

    fireEvent.press(await screen.findByTestId('booking-review-confirm'));

    expect(
      await screen.findByText('Masz już maksymalną liczbę aktywnych rezerwacji.'),
    ).toBeOnTheScreen();
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/booking/schedule');
  });

  it('confirms abandonment when a hold is active and close is pressed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    renderBookingScreen(<BookingReviewScreen />, {
      draft: { ...draft, hold: { hold_id: 'h1', expires_at: '2099-01-01T00:00:00Z' } },
    });

    fireEvent.press(await screen.findByLabelText('Zamknij'));
    expect(alertSpy).toHaveBeenCalled();
  });
});
