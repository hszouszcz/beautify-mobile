import { Alert } from 'react-native';

import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createBooking, updateMe, verifyPhoneAuth } from '@/api';
import BookingVerifyScreen from '@/app/booking/verify';
import {
  makeBooking,
  makeService,
  makeSlotOption,
  makeUser,
  renderBookingScreen,
} from '@/test/utils';

const mockRouter = { replace: jest.fn(), dismissAll: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  verifyPhoneAuth: jest.fn(),
  createBooking: jest.fn(),
  updateMe: jest.fn(),
}));
const mockVerify = verifyPhoneAuth as jest.MockedFunction<typeof verifyPhoneAuth>;
const mockCreateBooking = createBooking as jest.MockedFunction<typeof createBooking>;
const mockUpdateMe = updateMe as jest.MockedFunction<typeof updateMe>;
const { ApiError } = jest.requireActual('@/api') as typeof import('@/api');

const draft = {
  salonId: 1,
  service: makeService({ id: 7 }),
  staffId: 3,
  slot: makeSlotOption(),
  date: '2026-06-12',
  phone: '+48600700800',
  phoneHint: '••• 800',
  name: { first: 'Ada', last: 'Kowalska' },
};

describe('BookingVerifyScreen', () => {
  beforeEach(() => {
    mockVerify.mockReset();
    mockCreateBooking.mockReset();
    mockUpdateMe.mockReset();
    mockRouter.replace.mockReset();
  });

  it('verifies the code, creates the booking, and advances to confirmation', async () => {
    mockVerify.mockResolvedValue({
      message: 'ok',
      user: makeUser({ first_name: '' }),
      access: 'acc',
      refresh: 'ref',
      is_new_user: true,
    });
    mockUpdateMe.mockResolvedValue(makeUser({ first_name: 'Ada' }));
    mockCreateBooking.mockResolvedValue({ booking: makeBooking({ status: 'CONFIRMED' }) });

    renderBookingScreen(<BookingVerifyScreen />, { draft });

    fireEvent.changeText(await screen.findByTestId('otp-input'), '1111');

    await waitFor(() =>
      expect(mockVerify).toHaveBeenCalledWith({ phone: '+48600700800', code: '1111' }),
    );
    await waitFor(() => expect(mockCreateBooking).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith('/booking/confirmation'),
    );
  });

  it('shows an error for a wrong code and clears the input', async () => {
    mockVerify.mockRejectedValue(new ApiError({ status: 400, message: 'bad code' }));

    renderBookingScreen(<BookingVerifyScreen />, { draft });
    fireEvent.changeText(await screen.findByTestId('otp-input'), '0000');

    expect(await screen.findByText('Nieprawidłowy kod')).toBeOnTheScreen();
    expect(mockCreateBooking).not.toHaveBeenCalled();
  });

  it('shows the expired-code message on a 401', async () => {
    mockVerify.mockRejectedValue(new ApiError({ status: 401, message: 'expired' }));

    renderBookingScreen(<BookingVerifyScreen />, { draft });
    fireEvent.changeText(await screen.findByTestId('otp-input'), '0000');

    expect(await screen.findByText('Kod wygasł. Wyślij nowy.')).toBeOnTheScreen();
  });

  it('recovers to Schedule when the slot was taken after verification (409)', async () => {
    mockVerify.mockResolvedValue({
      message: 'ok',
      user: makeUser({ first_name: 'Ada' }),
      access: 'acc',
      refresh: 'ref',
      is_new_user: false,
    });
    mockCreateBooking.mockRejectedValue(new ApiError({ status: 409, message: 'slot taken' }));

    renderBookingScreen(<BookingVerifyScreen />, { draft });
    fireEvent.changeText(await screen.findByTestId('otp-input'), '1111');

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith('/booking/schedule'),
    );
  });

  it('shows the limit error (createError phase) when the user is at their booking cap', async () => {
    mockVerify.mockResolvedValue({
      message: 'ok',
      user: makeUser({ first_name: 'Ada' }),
      access: 'acc',
      refresh: 'ref',
      is_new_user: false,
    });
    mockCreateBooking.mockRejectedValue(
      new ApiError({ status: 409, message: 'maksymalna liczba — limit' }),
    );

    renderBookingScreen(<BookingVerifyScreen />, { draft });
    fireEvent.changeText(await screen.findByTestId('otp-input'), '1111');

    expect(
      await screen.findByText('Masz już maksymalną liczbę aktywnych rezerwacji.'),
    ).toBeOnTheScreen();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('confirms abandonment when a slot hold is active and close is pressed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    renderBookingScreen(<BookingVerifyScreen />, {
      draft: { ...draft, hold: { hold_id: 'h1', expires_at: '2099-01-01T00:00:00Z' } },
    });

    fireEvent.press(await screen.findByLabelText('Zamknij'));
    expect(alertSpy).toHaveBeenCalled();
  });
});
