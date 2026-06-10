import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { getAllServices, getPostBooking, getSalon } from '@/api';
import BookingServiceScreen from '@/app/booking/service';
import { makeSalon, makeService, renderBookingScreen } from '@/test/utils';

const mockRouter = { push: jest.fn(), dismissAll: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ salonId: '1' }),
}));

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  getAllServices: jest.fn(),
  getSalon: jest.fn(),
  getPostBooking: jest.fn(),
}));
const mockServices = getAllServices as jest.MockedFunction<typeof getAllServices>;
const mockSalon = getSalon as jest.MockedFunction<typeof getSalon>;
const mockPostBooking = getPostBooking as jest.MockedFunction<typeof getPostBooking>;

describe('BookingServiceScreen', () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
    mockServices.mockResolvedValue([
      makeService({ id: 11, salon: 1, name: 'Strzyżenie' }),
      makeService({ id: 12, salon: 1, name: 'Koloryzacja' }),
    ]);
    mockSalon.mockResolvedValue(makeSalon({ id: 1 }));
    mockPostBooking.mockRejectedValue(new Error('no post'));
  });

  it('lists the salon services and gates the CTA until one is chosen', async () => {
    renderBookingScreen(<BookingServiceScreen />);

    expect(await screen.findByText('Strzyżenie')).toBeOnTheScreen();
    expect(screen.getByTestId('booking-service-next')).toBeDisabled();
  });

  it('selects a service and advances to schedule', async () => {
    renderBookingScreen(<BookingServiceScreen />);

    fireEvent.press(await screen.findByTestId('service-row-11'));
    await waitFor(() =>
      expect(screen.getByTestId('booking-service-next')).not.toBeDisabled(),
    );

    fireEvent.press(screen.getByTestId('booking-service-next'));
    expect(mockRouter.push).toHaveBeenCalledWith('/booking/schedule');
  });
});
