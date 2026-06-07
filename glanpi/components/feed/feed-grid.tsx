import { LegendList } from '@legendapp/list/react-native';
import { StyleSheet, View } from 'react-native';

import { GSpinner } from '@/components/ui';
import { useAppTheme } from '@/theme';

import { FeedTile } from './feed-tile';
import type { FeedTileModel } from './to-feed-tiles';

export type FeedGridProps = {
  tiles: FeedTileModel[];
  onPressTile?: (tile: FeedTileModel) => void;
  onEndReached?: () => void;
  /** Show a spinner row at the bottom while the next page loads. */
  isLoadingMore?: boolean;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType | React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/**
 * Generic mosaic asset grid built on LegendList (per project rules — never
 * FlatList/ScrollView). Renders `FeedTile`s in a 2-column layout where each tile
 * may span both columns (`overrideItemLayout` → `span`), producing a
 * Pinterest-style mosaic. Supports infinite scroll (`onEndReached`), a loading
 * footer, pull-to-refresh and empty state. Carries no user-facing copy — the
 * screen owns all text.
 */
export function FeedGrid({
  tiles,
  onPressTile,
  onEndReached,
  isLoadingMore,
  ListHeaderComponent,
  ListEmptyComponent,
  refreshing,
  onRefresh,
}: FeedGridProps) {
  const { app } = useAppTheme();

  return (
    <LegendList
      data={tiles}
      keyExtractor={(item) => item.id}
      numColumns={2}
      estimatedItemSize={180}
      recycleItems
      overrideItemLayout={(layout, item) => {
        layout.span = item.span;
      }}
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
      contentContainerStyle={{ padding: app.spacing.sm, gap: app.spacing.sm }}
      columnWrapperStyle={{ gap: app.spacing.sm }}
      renderItem={({ item }) => (
        <FeedTile
          uri={item.imageUrl}
          aspectRatio={item.aspectRatio}
          onPress={() => onPressTile?.(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', justifyContent: 'center' },
});
