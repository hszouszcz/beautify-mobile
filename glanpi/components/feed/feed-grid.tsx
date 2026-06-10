import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

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
  /** When provided, the list writes its scroll offset here on every frame. */
  sharedScrollOffset?: SharedValue<number>;
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
  sharedScrollOffset,
}: FeedGridProps) {
  const { app } = useAppTheme();

  return (
    <AnimatedLegendList
      data={tiles}
      keyExtractor={(item) => item.id}
      numColumns={2}
      estimatedItemSize={180}
      recycleItems
      // Required by LegendList whenever the data set changes (infinite-scroll
      // pages + pull-to-refresh here). Without it, swapping data under
      // `recycleItems` + a variable-height multi-column layout can leave the
      // list blank — items "disappear" on reload/refresh.
      maintainVisibleContentPosition
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
      sharedValues={sharedScrollOffset != null ? { scrollOffset: sharedScrollOffset } : undefined}
      renderItem={({ item }) => (
        <FeedTile
          uri={item.imageUrl}
          aspectRatio={item.aspectRatio}
          onPress={() => onPressTile?.(item)}
          testID={`feed-tile-${item.id}`}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', justifyContent: 'center' },
});
