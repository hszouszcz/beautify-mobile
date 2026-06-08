import { LegendList } from '@legendapp/list/react-native';
import { StyleSheet, View } from 'react-native';

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
}: SalonListProps) {
  const { app } = useAppTheme();

  return (
    <LegendList
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
        paddingHorizontal: app.spacing.lg,
        paddingVertical: app.spacing.sm,
        gap: app.spacing.md,
      }}
      renderItem={({ item }) => <SalonListItem salon={item} onPress={onPressSalon} />}
    />
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', justifyContent: 'center' },
});
