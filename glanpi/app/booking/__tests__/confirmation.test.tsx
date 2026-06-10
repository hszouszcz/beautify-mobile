import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import BookingConfirmationScreen from '@/app/booking/confirmation';
import { makeBooking, makeService, makeSlotOption, renderBookingScreen } from '@/test/utils';

const mockRouter = { dismissAll: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const baseDraft = {
  salonName: 'Studio Glanc',
  salonAddress: 'ul. Piękna 1',
  service: makeService(),
  slot: makeSlotOption(),
  date: '2026-06-12',
  staffName: 'Marta',
};

describe('BookingConfirmationScreen', () => {
  beforeEach(() => {
    mockRouter.dismissAll.mockReset();
    mockRouter.push.mockReset();
  });

  it('shows the CONFIRMED variant for a confirmed booking', async () => {
    renderBookingScreen(<BookingConfirmationScreen />, {
      draft: { ...baseDraft, createdBooking: makeBooking({ status: 'CONFIRMED' }) },
    });
    expect(await screen.findByText('Rezerwacja potwierdzona!')).toBeOnTheScreen();
  });

  it('shows the PENDING variant for a pending booking', async () => {
    renderBookingScreen(<BookingConfirmationScreen />, {
      draft: { ...baseDraft, createdBooking: makeBooking({ status: 'PENDING' }) },
    });
    expect(await screen.findByText('Prośba wysłana')).toBeOnTheScreen();
  });

  it('dismisses the flow when "Gotowe" is pressed', async () => {
    renderBookingScreen(<BookingConfirmationScreen />, {
      draft: { ...baseDraft, createdBooking: makeBooking({ status: 'CONFIRMED' }) },
    });
    fireEvent.press(await screen.findByText('Gotowe'));
    await waitFor(() => expect(mockRouter.dismissAll).toHaveBeenCalled());
  });
});
