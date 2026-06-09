import { Stack } from 'expo-router';

import { BookingDraftProvider } from '@/providers/booking-draft-provider';

/**
 * Booking flow modal group. Its own step stack so native back / back-gesture
 * move one step at a time while the modal stays over the post/salon (design §5).
 * Cross-step state lives in `BookingDraftProvider`, scoped to this group so it
 * resets when the flow closes.
 */
export default function BookingLayout() {
  return (
    <BookingDraftProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
        <Stack.Screen name="service" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="details" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="review" />
        <Stack.Screen name="confirmation" options={{ gestureEnabled: false }} />
      </Stack>
    </BookingDraftProvider>
  );
}
