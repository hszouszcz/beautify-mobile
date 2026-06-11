import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createSlotHold, getAvailability, getBusinessHours, getStaff } from '@/api';
import BookingScheduleScreen from '@/app/booking/schedule';
import {
  makeAvailability,
  makeBusinessHours,
  makeSlotOption,
  makeStaff,
  renderBookingScreen,
} from '@/test/utils';

const mockRouter = { push: jest.fn(), dismissAll: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  getStaff: jest.fn(),
  getBusinessHours: jest.fn(),
  getAvailability: jest.fn(),
  createSlotHold: jest.fn(),
}));
const mockStaff = getStaff as jest.MockedFunction<typeof getStaff>;
const mockHours = getBusinessHours as jest.MockedFunction<typeof getBusinessHours>;
const mockAvailability = getAvailability as jest.MockedFunction<typeof getAvailability>;
const mockHold = createSlotHold as jest.MockedFunction<typeof createSlotHold>;

// All days open so "today" (whatever it is) is always selectable.
const openWeek = Array.from({ length: 7 }, (_, d) =>
  makeBusinessHours({ id: d, salon: 1, day_of_week: d }),
);

const draft = {
  salonId: 1,
  service: { id: 7, name: 'Strzyżenie', duration_minutes: 45, price_display: '180.00' },
  timezone: 'Europe/Warsaw',
};

describe('BookingScheduleScreen', () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
    mockStaff.mockResolvedValue([
      makeStaff({ id: 'a', salon: 1, display_name: 'Marta' }),
      makeStaff({ id: 'b', salon: 1, display_name: 'Ola' }),
    ]);
    mockHours.mockResolvedValue(openWeek);
    mockAvailability.mockResolvedValue(
      makeAvailability({
        slot_options: [makeSlotOption({ display: { start_time: '09:00:00', end_time: '09:45:00' } })],
      }),
    );
    mockHold.mockResolvedValue({ hold_id: 'h1', expires_at: '2026-06-12T07:05:00Z' });
  });

  it('loads availability, selects a slot, holds it, and routes to details (unauthenticated)', async () => {
    renderBookingScreen(<BookingScheduleScreen />, { draft });

    // The slot pill renders once availability resolves for the default staff/date.
    const slot = await screen.findByLabelText(/dostępny termin/);
    fireEvent.press(slot);

    const cta = screen.getByTestId('booking-schedule-next');
    await waitFor(() => expect(cta).not.toBeDisabled());

    fireEvent.press(cta);

    await waitFor(() => expect(mockHold).toHaveBeenCalled());
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/booking/details'));
  });

  it('proceeds even if the slot hold fails (advisory only)', async () => {
    mockHold.mockRejectedValue(new Error('hold failed'));
    renderBookingScreen(<BookingScheduleScreen />, { draft });

    fireEvent.press(await screen.findByLabelText(/dostępny termin/));
    fireEvent.press(screen.getByTestId('booking-schedule-next'));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/booking/details'));
  });

  it('hides slots whose start_datetime is in the past when today is selected', async () => {
    const pastSlot = makeSlotOption({
      start_datetime: '2000-01-01T07:00:00Z',
      end_datetime: '2000-01-01T07:45:00Z',
    });
    const futureSlot = makeSlotOption({
      start_datetime: '2099-12-31T07:00:00Z',
      end_datetime: '2099-12-31T07:45:00Z',
      display: { start_time: '11:00:00', end_time: '11:45:00' },
    });
    mockAvailability.mockResolvedValue(
      makeAvailability({ slot_options: [pastSlot, futureSlot] }),
    );

    renderBookingScreen(<BookingScheduleScreen />, { draft });

    // Only the future slot should be rendered.
    await screen.findByLabelText(/dostępny termin/);
    expect(screen.getAllByLabelText(/dostępny termin/)).toHaveLength(1);
  });
});
