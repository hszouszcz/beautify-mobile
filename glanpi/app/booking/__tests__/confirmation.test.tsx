import { CommonActions } from '@react-navigation/native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import BookingConfirmationScreen from '@/app/booking/confirmation';
import { makeBooking, makeService, makeSlotOption, renderBookingScreen } from '@/test/utils';

const mockDispatch = jest.fn();
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useNavigationContainerRef: () => ({ dispatch: mockDispatch, isReady: () => true }),
}));

const baseDraft = {
  salonName: 'Studio Glanc',
  salonAddress: 'ul. Piękna 1',
  service: makeService(),
  slot: makeSlotOption(),
  date: '2026-06-12',
  staffName: 'Marta',
};

describe('BookingConfirmationScreen', () => {
  beforeEach(() => mockDispatch.mockReset());

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

  it('"Gotowe" resets root navigation state to the calendar tab', async () => {
    renderBookingScreen(<BookingConfirmationScreen />, {
      draft: { ...baseDraft, createdBooking: makeBooking({ status: 'confirmed' }) },
    });
    fireEvent.press(await screen.findByText('Gotowe'));

    await waitFor(() => expect(mockDispatch).toHaveBeenCalledTimes(1));
    expect(mockDispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{
          name: '(tabs)',
          state: {
            index: 2,
            routes: [
              { name: 'index' },
              { name: 'find' },
              { name: 'calendar' },
              { name: 'profile' },
            ],
          },
        }],
      }),
    );
  });
});
