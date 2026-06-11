import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Booking } from '@/api';
import { GButton, GCard, GText } from '@/components/ui';
import { formatDuration, formatPrice } from '@/lib/format';
import { formatBookingDateTime } from '@/lib/datetime';
import { useAppTheme } from '@/theme';

import { BookingStatusBadge } from './booking-status-badge';

export type BookingListCardProps = {
  booking: Booking;
  /** Render at reduced opacity (past / closed visits). */
  dimmed?: boolean;
  onPress?: () => void;
  /** When provided, shows the "Anuluj" action (upcoming, cancellable visits). */
  onCancel?: () => void;
  /** When provided, shows the "Zmień termin" action. */
  onReschedule?: () => void;
  /** Disables the action buttons while a mutation is in flight. */
  actionsDisabled?: boolean;
};

/**
 * One booking row in the "Moje wizyty" list — a list-optimized sibling of
 * `BookingSummaryCard`. Header (salon + status), service · duration, optional
 * staff line, and the date+time in the salon timezone. Cancel / reschedule
 * actions render only when their handlers are passed.
 */
export function BookingListCard({
  booking,
  dimmed = false,
  onPress,
  onCancel,
  onReschedule,
  actionsDisabled = false,
}: BookingListCardProps) {
  const { t } = useTranslation();
  const { app } = useAppTheme();

  const duration = booking.service_duration
    ? formatDuration(Number(booking.service_duration))
    : undefined;
  const serviceLine = [booking.service_name, duration].filter(Boolean).join(' · ');
  const staffName = booking.staff_name ?? undefined;
  const price = formatPrice(booking.service_price ?? null);
  const showActions = onCancel != null || onReschedule != null;

  return (
    <GCard onPress={onPress} padding="lg">
      <View style={[{ gap: app.spacing.sm }, dimmed && styles.dimmed]}>
        <View style={styles.headerRow}>
          <GText variant="titleSmall" style={styles.salonName} numberOfLines={1}>
            {booking.salon_name}
          </GText>
          <BookingStatusBadge status={booking.status} />
        </View>

        <GText variant="body">{serviceLine}</GText>

        {staffName && (
          <GText variant="body" color="muted">
            {t('booking.confirmation.with', { name: staffName })}
          </GText>
        )}

        <Row icon="calendar-clock" text={formatBookingDateTime(booking.start_time)} />
        {price != null && <Row icon="cash" text={price} />}
      </View>

      {showActions && (
        <View style={[styles.actions, { marginTop: app.spacing.md, gap: app.spacing.sm }]}>
          {onReschedule != null && (
            <GButton
              kind="secondary"
              label={t('bookings.reschedule.action')}
              onPress={onReschedule}
              disabled={actionsDisabled}
            />
          )}
          {onCancel != null && (
            <GButton
              kind="text"
              label={t('bookings.cancel.action')}
              onPress={onCancel}
              disabled={actionsDisabled}
            />
          )}
        </View>
      )}
    </GCard>
  );
}

function Row({ icon, text }: { icon: string; text: string }) {
  const { app } = useAppTheme();
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon as never} size={16} color={app.colors.textMuted} />
      <GText variant="body" style={styles.rowText}>
        {text}
      </GText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  salonName: { flexShrink: 1 },
  dimmed: { opacity: 0.55 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
});
