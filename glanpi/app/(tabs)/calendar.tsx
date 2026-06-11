import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Booking } from '@/api';
import { BookingsList, type BookingRow } from '@/components/bookings';
import { AppHeader } from '@/components/layout';
import { GEmptyState, GScreen, GSpinner } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { useMyBookings } from '@/hooks/use-my-bookings';
import { isPastBooking } from '@/lib/datetime';
import { useAppTheme } from '@/theme';

/**
 * "Moje wizyty" tab (PRD §5.2 pt. 11) — the signed-in client's bookings, split
 * into upcoming and past sections. Replaces the old Calendar placeholder; the
 * route id stays `calendar` so the booking-confirmation deep-link still resolves.
 * Salon-side incoming-booking management is a separate view (the tab can branch
 * on `user.role` later).
 */
export default function BookingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { app } = useAppTheme();
  const { status } = useAuth();
  const { data, isLoading, isError, refetch, isRefetching } = useMyBookings();

  const rows = useMemo<BookingRow[]>(() => {
    const bookings = data ?? [];
    const upcoming = bookings
      .filter((b) => !isPastBooking(b))
      .sort((a, b) => (a.start_time < b.start_time ? -1 : 1));
    const past = bookings
      .filter(isPastBooking)
      .sort((a, b) => (a.start_time > b.start_time ? -1 : 1));

    const result: BookingRow[] = [];
    if (upcoming.length > 0) {
      result.push({ type: 'header', key: 'h-upcoming', label: t('bookings.section.upcoming') });
      for (const b of upcoming) {
        result.push({ type: 'card', key: `c-${b.id}`, booking: b, dimmed: false });
      }
    }
    if (past.length > 0) {
      result.push({ type: 'header', key: 'h-past', label: t('bookings.section.past') });
      for (const b of past) {
        result.push({ type: 'card', key: `c-${b.id}`, booking: b, dimmed: true });
      }
    }
    return result;
  }, [data, t]);

  const browseSalons = () => router.navigate('/(tabs)/find');
  const openSalon = (booking: Booking) => router.push(`/salon/${booking.salon}`);

  let content: React.ReactNode;
  if (status !== 'authenticated') {
    content = (
      <GEmptyState
        icon="calendar-blank"
        title={t('bookings.signedOut.title')}
        description={t('bookings.signedOut.description')}
        actionLabel={t('bookings.signedOut.action')}
        onAction={browseSalons}
      />
    );
  } else if (isLoading) {
    content = <GSpinner centered />;
  } else if (isError) {
    content = (
      <GEmptyState
        icon="wifi-off"
        title={t('bookings.error.title')}
        actionLabel={t('bookings.error.retry')}
        onAction={() => refetch()}
      />
    );
  } else if (rows.length === 0) {
    content = (
      <GEmptyState
        icon="calendar-blank"
        title={t('bookings.empty.title')}
        description={t('bookings.empty.description')}
        actionLabel={t('bookings.empty.action')}
        onAction={browseSalons}
      />
    );
  } else {
    content = (
      <BookingsList
        rows={rows}
        onPressBooking={openSalon}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentBottomInset={app.spacing.xl}
      />
    );
  }

  return (
    <GScreen edges={['top']} padded={false}>
      <AppHeader
        title={t('bookings.title')}
        style={{ paddingTop: app.spacing.sm, paddingBottom: app.spacing.md }}
      />
      <View style={styles.content}>{content}</View>
    </GScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
});
