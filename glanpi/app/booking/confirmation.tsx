import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { BookingSummaryCard } from '@/components/booking';
import { GBottomBar, GButton, GScreen, GText } from '@/components/ui';
import { track } from '@/lib/analytics';
import { formatLongDate, formatShortDate, formatSlotTime } from '@/lib/datetime';
import { formatDuration, formatPrice } from '@/lib/format';
import { useBookingDraft } from '@/providers/booking-draft-provider';
import { useAppTheme } from '@/theme';

/**
 * Booking · Step 5 — Confirmation (design §5.6). Two variants driven by the
 * created booking's status: CONFIRMED (green check) or PENDING (accent
 * hourglass). The step stack was already removed (`router.replace`) so back/✕
 * can't re-enter a completed flow.
 */
export default function BookingConfirmationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { app } = useAppTheme();
  const { draft, reset } = useBookingDraft();

  const booking = draft.createdBooking;
  const isConfirmed = booking?.status === 'CONFIRMED';

  useEffect(() => {
    if (isConfirmed) track('booking_confirmed', { status: 'CONFIRMED' });
  }, [isConfirmed]);

  const service = draft.service;
  const slotTime = draft.slot ? formatSlotTime(draft.slot.display.start_time) : '';

  const close = () => {
    reset();
    router.dismissAll();
  };
  const viewInCalendar = () => {
    reset();
    router.dismissAll();
    router.push('/(tabs)/calendar');
  };

  return (
    <GScreen edges={['top']} tone="background" padded={false}>
      <ScrollView contentContainerStyle={[styles.content, { padding: app.spacing.xl, gap: app.spacing.lg }]}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={isConfirmed ? 'check-circle' : 'timer-sand'}
            size={72}
            color={isConfirmed ? app.colors.success : app.colors.accent}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(250)} style={[styles.heading, { gap: app.spacing.xs }]}>
          <GText variant="title" align="center">
            {isConfirmed
              ? t('booking.confirmation.confirmedTitle')
              : t('booking.confirmation.pendingTitle')}
          </GText>
          <GText variant="body" color="muted" align="center">
            {isConfirmed
              ? t('booking.confirmation.confirmedBody', {
                  date: draft.date ? formatLongDate(draft.date) : '',
                })
              : t('booking.confirmation.pendingBody')}
          </GText>
        </Animated.View>

        {service && (
          <BookingSummaryCard
            salonName={draft.salonName ?? booking?.salon.name ?? ''}
            serviceName={service.name}
            duration={formatDuration(service.duration_minutes)}
            staffLine={
              draft.staffName ? t('booking.confirmation.with', { name: draft.staffName }) : undefined
            }
            dateTimeLabel={draft.date ? `${formatShortDate(draft.date)} · ${slotTime}` : slotTime}
            price={formatPrice(service.price_display)}
            address={draft.salonAddress}
          />
        )}

        {isConfirmed && (
          <GText variant="caption" color="faint" align="center">
            {t('booking.confirmation.addedToCalendar')}
          </GText>
        )}
      </ScrollView>

      <GBottomBar>
        <View style={styles.actions}>
          <GButton
            kind="secondary"
            fullWidth
            label={t('booking.confirmation.viewInCalendar')}
            onPress={viewInCalendar}
          />
          <GButton
            fullWidth
            label={t('booking.confirmation.done')}
            onPress={close}
            testID="booking-done"
          />
        </View>
      </GBottomBar>
    </GScreen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { alignItems: 'center' },
  heading: { alignItems: 'center' },
  actions: { flex: 1, gap: 8 },
});
