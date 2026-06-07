import { LegendList } from '@legendapp/list/react-native';

import { useAppTheme } from '@/theme';

import { FeedTile } from './feed-tile';

export type FeedPost = {
  id: string;
  imageUrl: string;
};

export type FeedGridProps = {
  posts: FeedPost[];
  onPressPost?: (post: FeedPost) => void;
  /** Columns in the grid. Default: 3 (matches the Explore mockup). */
  numColumns?: number;
  onEndReached?: () => void;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType | React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/**
 * Explore feed grid. Built on LegendList (per project rules — never
 * FlatList/ScrollView). Renders `FeedTile`s in a gapped N-column grid with
 * infinite-scroll support via `onEndReached`.
 */
export function FeedGrid({
  posts,
  onPressPost,
  numColumns = 3,
  onEndReached,
  ListHeaderComponent,
  ListEmptyComponent,
  refreshing,
  onRefresh,
}: FeedGridProps) {
  const { app } = useAppTheme();

  return (
    <LegendList
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      estimatedItemSize={140}
      recycleItems
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ padding: app.spacing.sm, gap: app.spacing.sm }}
      columnWrapperStyle={{ gap: app.spacing.sm }}
      renderItem={({ item }) => (
        <FeedTile uri={item.imageUrl} onPress={() => onPressPost?.(item)} />
      )}
    />
  );
}
