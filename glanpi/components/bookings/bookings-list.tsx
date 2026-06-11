import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { StyleSheet, View } from 'react-native';

import type { Booking } from '@/api';
import { GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

import { BookingListCard } from './booking-list-card';

/** A flat row in the sectioned bookings list: either a section header or a card. */
export type BookingRow =
  | { type: 'header'; key: string; label: string }
  | { type: 'card'; key: string; booking: Booking; dimmed: boolean };

export type BookingsListProps = {
  rows: BookingRow[];
  onPressBooking: (booking: Booking) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Extra bottom padding so the last card clears the tab bar. */
  contentBottomInset?: number;
};

/**
 * Single-column sectioned bookings list on LegendList (project rule — never
 * FlatList/ScrollView). Section headers ("Nadchodzące" / "Minione") are inline
 * rows; past cards are dimmed. Carries no user-facing copy beyond what the rows
 * supply — the screen owns all text.
 */
export function BookingsList({
  rows,
  onPressBooking,
  refreshing,
  onRefresh,
  contentBottomInset = 0,
}: BookingsListProps) {
  const { app } = useAppTheme();

  return (
    <AnimatedLegendList
      data={rows}
      keyExtractor={(item) => item.key}
      estimatedItemSize={168}
      recycleItems
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{
        paddingHorizontal: app.spacing.lg,
        paddingTop: app.spacing.sm,
        paddingBottom: app.spacing.sm + contentBottomInset,
        gap: app.spacing.md,
      }}
      renderItem={({ item }) =>
        item.type === 'header' ? (
          <View style={{ paddingTop: app.spacing.sm }}>
            <GText variant="label" color="muted" style={styles.headerLabel}>
              {item.label}
            </GText>
          </View>
        ) : (
          <BookingListCard
            booking={item.booking}
            dimmed={item.dimmed}
            onPress={() => onPressBooking(item.booking)}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  headerLabel: { textTransform: 'uppercase', letterSpacing: 0.5 },
});
