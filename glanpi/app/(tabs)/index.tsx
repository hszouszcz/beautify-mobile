import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PostType } from '@/api';
import { ExploreHeader, FeedGrid, toFeedTiles } from '@/components/feed';
import { GEmptyState, GScreen, GSpinner } from '@/components/ui';
import { useCity } from '@/hooks/use-city';
import { useCityFeed } from '@/hooks/use-city-feed';

/**
 * Explore tab — the visual, city-scoped feed (PRD §5.1/§5.2). Anonymous-friendly
 * (the `city_feed` endpoint is public). Renders a Pinterest-style mosaic with
 * infinite scroll, pull-to-refresh, category filtering and city switching.
 */
export default function ExploreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { city, setCity } = useCity();
  const [postType, setPostType] = useState<PostType | undefined>(undefined);

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

  const header = (
    <ExploreHeader
      city={city}
      onSelectCity={setCity}
      postType={postType}
      onChangePostType={setPostType}
    />
  );

  // Initial load: spinner under the header (header stays interactive).
  if (isLoading) {
    return (
      <GScreen edges={['top']} padded={false}>
        {header}
        <GSpinner centered />
      </GScreen>
    );
  }

  // Hard error fetching the first page.
  if (isError) {
    return (
      <GScreen edges={['top']} padded={false}>
        {header}
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
      {header}
      <FeedGrid
        tiles={tiles}
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
