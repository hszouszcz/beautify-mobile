import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { initiatePhoneAuth } from '@/api';
import BookingDetailsScreen from '@/app/booking/details';
import { renderBookingScreen } from '@/test/utils';

const mockRouter = { push: jest.fn(), dismissAll: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  initiatePhoneAuth: jest.fn(),
}));
const mockInitiate = initiatePhoneAuth as jest.MockedFunction<typeof initiatePhoneAuth>;
const { ApiError } = jest.requireActual('@/api') as typeof import('@/api');

describe('BookingDetailsScreen', () => {
  beforeEach(() => {
    mockInitiate.mockReset();
    mockRouter.push.mockReset();
  });

  it('keeps the CTA disabled until a name and valid phone are entered', async () => {
    renderBookingScreen(<BookingDetailsScreen />);
    const cta = await screen.findByTestId('booking-details-send');
    expect(cta).toBeDisabled();

    fireEvent.changeText(screen.getByTestId('field-firstName'), 'Ada');
    fireEvent.changeText(screen.getByTestId('field-phone'), '600700800');

    await waitFor(() => expect(cta).not.toBeDisabled());
  });

  it('initiates SMS and advances to verify on success', async () => {
    mockInitiate.mockResolvedValue({
      message: 'ok',
      phone_number_hint: '••• 800',
      resend_wait_seconds: 30,
    });
    renderBookingScreen(<BookingDetailsScreen />);

    fireEvent.changeText(await screen.findByTestId('field-firstName'), 'Ada');
    fireEvent.changeText(screen.getByTestId('field-phone'), '600700800');
    fireEvent.press(screen.getByTestId('booking-details-send'));

    await waitFor(() =>
      expect(mockInitiate).toHaveBeenCalledWith({ phone: '+48600700800' }),
    );
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/booking/verify'));
  });

  it('shows a rate-limit countdown on a 429 and does not navigate', async () => {
    mockInitiate.mockRejectedValue(
      new ApiError({ status: 429, message: 'slow', retryAfterSeconds: 30 }),
    );
    renderBookingScreen(<BookingDetailsScreen />);

    fireEvent.changeText(await screen.findByTestId('field-firstName'), 'Ada');
    fireEvent.changeText(screen.getByTestId('field-phone'), '600700800');
    fireEvent.press(screen.getByTestId('booking-details-send'));

    expect(await screen.findByText(/Zbyt wiele prób/)).toBeOnTheScreen();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
