import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PostType } from '@/api';
import { AppHeader, useCollapsingHeader } from '@/components/layout';
import { ExploreCategoryFilters, ExploreHeader, FeedGrid, toFeedTiles } from '@/components/feed';
import { GEmptyState, GScreen, GSpinner } from '@/components/ui';
import { useCity } from '@/hooks/use-city';
import { useCityFeed } from '@/hooks/use-city-feed';
import { useAppTheme } from '@/theme';

/**
 * Explore tab — the visual, city-scoped feed (PRD §5.1/§5.2). Anonymous-friendly
 * (the `city_feed` endpoint is public). Renders a Pinterest-style mosaic with
 * infinite scroll, pull-to-refresh, category filtering and city switching.
 *
 * Scroll behaviour: the full `ExploreHeader` lives as `ListHeaderComponent` and
 * scrolls with the feed. A compact sticky bar (opacity-animated overlay) fades in
 * once the user scrolls past the collapse threshold, keeping the title visible at
 * all times without consuming screen real-estate at rest.
 */
export default function ExploreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { app } = useAppTheme();
  const { city, setCity } = useCity();
  const [postType, setPostType] = useState<PostType | undefined>(undefined);
  const insets = useSafeAreaInsets();
  const { scrollOffset, compactBarStyle } = useCollapsingHeader();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCityFeed(city, postType);

  const tiles = useMemo(
    () => toFeedTiles(data?.pages.flatMap((page) => page.results) ?? []),
    [data],
  );

  const expandedHeader = (
    <ExploreHeader
      city={city}
      onSelectCity={setCity}
      postType={postType}
      onChangePostType={setPostType}
    />
  );

  // Compact sticky bar — positioned absolutely so it floats above all content.
  // The outer View handles positioning; the inner Animated.View owns opacity +
  // translateY so we avoid mixing StyleSheet styles with animated styles (a
  // Reanimated 4.x type incompatibility). The background + border live on
  // AppHeader so they fade in with the animation via opacity inheritance.
  const compactBar = (
    <View style={styles.compactBarOuter} pointerEvents="box-none">
      <Animated.View style={compactBarStyle}>
        <AppHeader
          compact
          title={t('explore.title')}
          filters={
            <ExploreCategoryFilters
              postType={postType}
              onChangePostType={setPostType}
            />
          }
          style={{
            // paddingTop overrides the compact default (spacing.sm) so the title
            // clears the physical status bar; paddingBottom stays at spacing.sm.
            paddingTop: insets.top + app.spacing.sm,
            // FeedGrid's contentContainerStyle adds spacing.sm (8px) of horizontal
            // inset to ListHeaderComponent. Match that here so title and chips sit
            // at the same x-position in both header states during the crossfade.
            paddingHorizontal: app.spacing.lg + app.spacing.sm,
            backgroundColor: app.colors.backgroundStrong,
            ...app.elevation.card,
          }}
        />
      </Animated.View>
    </View>
  );

  if (isLoading) {
    return (
      <GScreen edges={['top']} padded={false}>
        {compactBar}
        {expandedHeader}
        <GSpinner centered />
      </GScreen>
    );
  }

  if (isError) {
    return (
      <GScreen edges={['top']} padded={false}>
        {compactBar}
        {expandedHeader}
        <GEmptyState
          icon="wifi-off"
          title={t('explore.error.title')}
          actionLabel={t('explore.error.retry')}
          onAction={() => refetch()}
        />
      </GScreen>
    );
  }

  return (
    <GScreen edges={['top']} padded={false}>
      {compactBar}
      <FeedGrid
        tiles={tiles}
        sharedScrollOffset={scrollOffset}
        ListHeaderComponent={expandedHeader}
        onPressTile={(tile) => router.push(`/post/${tile.id}`)}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        isLoadingMore={isFetchingNextPage}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        ListEmptyComponent={
          <GEmptyState
            title={t('explore.empty.title')}
            description={t('explore.empty.description')}
          />
        }
      />
    </GScreen>
  );
}

const styles = StyleSheet.create({
  // Positioning-only wrapper; no background so the full header shows through
  // at rest. Background lives on AppHeader (inside the Animated.View) so it
  // fades in together with the content via opacity inheritance.
  compactBarOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
