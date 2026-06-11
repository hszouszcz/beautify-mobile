import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import BookingConfirmationScreen from '@/app/booking/confirmation';
import { makeBooking, makeService, makeSlotOption, renderBookingScreen } from '@/test/utils';

const mockRouter = { dismissAll: jest.fn(), replace: jest.fn(), push: jest.fn(), navigate: jest.fn() };
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
    mockRouter.navigate.mockReset();
  });

  it('shows the CONFIRMED variant for a confirmed booking', async () => {
    renderBookingScreen(<BookingConfirmationScreen />, {
      draft: { ...baseDraft, createdBooking: makeBooking({ status: 'confirmed' }) },
    });
    expect(await screen.findByText('Rezerwacja potwierdzona!')).toBeOnTheScreen();
  });

  it('shows the PENDING variant for a pending booking', async () => {
    renderBookingScreen(<BookingConfirmationScreen />, {
      draft: { ...baseDraft, createdBooking: makeBooking({ status: 'pending' }) },
    });
    expect(await screen.findByText('Prośba wysłana')).toBeOnTheScreen();
  });

  it('"Gotowe" navigates to the visits tab (popping the modal stack)', async () => {
    renderBookingScreen(<BookingConfirmationScreen />, {
      draft: { ...baseDraft, createdBooking: makeBooking({ status: 'confirmed' }) },
    });
    fireEvent.press(await screen.findByText('Gotowe'));
    await waitFor(() => expect(mockRouter.navigate).toHaveBeenCalledWith('/(tabs)/calendar'));
    expect(mockRouter.dismissAll).not.toHaveBeenCalled();
  });
});
