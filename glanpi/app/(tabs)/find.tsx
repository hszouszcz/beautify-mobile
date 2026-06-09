import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Salon } from '@/api';
import { FilterButton, FindHeader, FindViewToggle, SalonList, SalonMap, type FindView } from '@/components/find';
import { AppHeader, useCollapsingHeader } from '@/components/layout';
import { GEmptyState, GScreen, GSpinner } from '@/components/ui';
import { useCity } from '@/hooks/use-city';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSalons } from '@/hooks/use-salons';
import { useFindFilters } from '@/providers/find-filters-provider';
import { useAppTheme } from '@/theme';

/**
 * Find tab — filtered salon browsing by city (PRD §5.1), with a List ↔ Map
 * toggle. The salon list (`useSalons`) is the primary source; each list card is
 * lazily enriched with services + work thumbnails. The search box drives the
 * server-side `q` filter (matches salon name, address, and active service names,
 * across all pages), debounced so each keystroke doesn't refetch. The result
 * `count` from the page envelope is surfaced as a "X salons found" header label.
 */
export default function FindScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { app } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { city, setCity } = useCity();
  const { filters, clear } = useFindFilters();
  const [view, setView] = useState<FindView>('list');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { scrollOffset, compactBarStyle } = useCollapsingHeader({ collapseThreshold: 120 });

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSalons(city, filters, debouncedSearch);

  const salons = useMemo(
    () => data?.pages.flatMap((page) => page.results) ?? [],
    [data],
  );

  // The envelope's `count` is the full filtered total (all pages), not just the
  // rows loaded so far — the right number for "X salons found".
  const resultCount = data?.pages[0]?.count;

  const goToSalon = (salon: Salon) => router.push(`/salon/${salon.id}`);

  const headerProps = {
    search,
    onChangeSearch: setSearch,
    city,
    onSelectCity: setCity,
    filters,
    resultCount: isLoading ? undefined : resultCount,
    onOpenFilters: () => router.push('/find/filters'),
    onClearFilters: clear,
  };

  // Compact sticky overlay — fades in as the user scrolls past the expanded header.
  // Uses AppHeader directly (no trailing slot) so the title stays centred, matching
  // the Explore compact bar exactly.
  const compactBar = (
    <View style={styles.compactBarOuter} pointerEvents="box-none">
      <Animated.View style={compactBarStyle}>
        <AppHeader
          compact
          title={t('find.title')}
          filters={
            <View style={styles.filterRow}>
              <FilterButton
                filters={filters}
                onPress={() => router.push('/find/filters')}
                onClear={clear}
              />
            </View>
          }
          style={{
            paddingTop: insets.top + app.spacing.sm,
            backgroundColor: app.colors.backgroundStrong,
            ...app.elevation.card,
          }}
        />
      </Animated.View>
    </View>
  );

  const expandedHeader = <FindHeader {...headerProps} />;

  // Empty / loading / error are handled at the screen level (not via the list's
  // ListEmptyComponent, which collapses to zero height when data is empty).
  const isEmpty = salons.length === 0;

  // In list view, the expanded header scrolls with the list as ListHeaderComponent
  // so the compact bar can fade in over it. In all other states the header is fixed.
  const isListView = !isLoading && !isError && !isEmpty && view === 'list';

  let content: React.ReactNode;
  if (isLoading) {
    content = <GSpinner centered />;
  } else if (isError) {
    content = (
      <GEmptyState
        icon="wifi-off"
        title={t('find.error.title')}
        actionLabel={t('find.error.retry')}
        onAction={() => refetch()}
      />
    );
  } else if (isEmpty) {
    content = (
      <GEmptyState
        title={t('find.empty.title')}
        description={t('find.empty.description')}
        actionLabel={search.trim() ? undefined : t('find.error.retry')}
        onAction={search.trim() ? undefined : () => refetch()}
      />
    );
  } else if (view === 'map') {
    content = <SalonMap salons={salons} city={city} onPressSalon={goToSalon} />;
  } else {
    content = (
      <SalonList
        salons={salons}
        onPressSalon={goToSalon}
        ListHeaderComponent={<View style={styles.header}>{expandedHeader}</View>}
        sharedScrollOffset={scrollOffset}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        isLoadingMore={isFetchingNextPage}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentBottomInset={app.spacing.xl + 44}
      />
    );
  }

  // The floating List ↔ Map pill only makes sense when there are results to
  // toggle between — hidden during loading / error / empty states.
  const showViewToggle = !isLoading && !isError && !isEmpty;

  return (
    <GScreen edges={['top']} padded={false}>
      {compactBar}
      {!isListView && <View style={styles.header}>{expandedHeader}</View>}
      <View style={styles.content}>
        {content}
        {showViewToggle && (
          <FindViewToggle view={view} onChange={setView} bottomInset={app.spacing.lg} />
        )}
      </View>
    </GScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: 8 },
  content: { flex: 1 },
  compactBarOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  // Row wrapper so the chip keeps its intrinsic width — AppHeader's column
  // layout would otherwise stretch it full-width.
  filterRow: { flexDirection: 'row' },
});
