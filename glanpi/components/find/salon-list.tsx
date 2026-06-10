import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { Salon } from '@/api';
import { GSpinner } from '@/components/ui';
import { useAppTheme } from '@/theme';

import { SalonListItem } from './salon-list-item';

export type SalonListProps = {
  salons: Salon[];
  onPressSalon: (salon: Salon) => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType | React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Extra bottom padding so a floating overlay (view toggle) can't cover the last row. */
  contentBottomInset?: number;
  /** When provided, the list writes its scroll offset here on every frame. */
  sharedScrollOffset?: SharedValue<number>;
};

/**
 * Single-column salon list built on LegendList (per project rule — never
 * FlatList/ScrollView). Each row is a `SalonListItem` (lazy-enriched card).
 * Supports infinite scroll, a loading footer, pull-to-refresh and empty state.
 * Carries no user-facing copy — the screen owns all text.
 */
export function SalonList({
  salons,
  onPressSalon,
  onEndReached,
  isLoadingMore,
  ListHeaderComponent,
  ListEmptyComponent,
  refreshing,
  onRefresh,
  contentBottomInset = 0,
  sharedScrollOffset,
}: SalonListProps) {
  const { app } = useAppTheme();

  return (
    <AnimatedLegendList
      data={salons}
      keyExtractor={(item) => String(item.id)}
      estimatedItemSize={260}
      recycleItems
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={[styles.footer, { paddingVertical: app.spacing.lg }]}>
            <GSpinner />
          </View>
        ) : null
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{
        // Shared list gutter — matches FeedGrid's `spacing.sm` so the Find and
        // Explore screens read with the same horizontal rhythm. The expanded
        // header (a ListHeaderComponent) inherits this inset, landing its title
        // at `sm + lg` to match Explore; the compact bar compensates with the
        // same `lg + sm`.
        paddingHorizontal: app.spacing.sm,
        paddingTop: app.spacing.sm,
        paddingBottom: app.spacing.sm + contentBottomInset,
        gap: app.spacing.md,
      }}
      sharedValues={sharedScrollOffset != null ? { scrollOffset: sharedScrollOffset } : undefined}
      renderItem={({ item }) => <SalonListItem salon={item} onPress={onPressSalon} />}
    />
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', justifyContent: 'center' },
});
