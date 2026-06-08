import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Salon } from '@/api';
import { FindHeader, SalonList, SalonMap, type FindView } from '@/components/find';
import { GEmptyState, GScreen, GSpinner } from '@/components/ui';
import { useCity } from '@/hooks/use-city';
import { useSalons } from '@/hooks/use-salons';

/**
 * Find tab — filtered salon browsing by city (PRD §5.1), with a List ↔ Map
 * toggle. The salon list (`useSalons`) is the primary source; each list card is
 * lazily enriched with services + work thumbnails. The search field filters the
 * already-loaded salons client-side by name/address (backend full-text search is
 * post-MVP).
 */
export default function FindScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { city, setCity } = useCity();
  const [view, setView] = useState<FindView>('list');
  const [search, setSearch] = useState('');

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSalons(city);

  const salons = useMemo(
    () => data?.pages.flatMap((page) => page.results) ?? [],
    [data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return salons;
    return salons.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q),
    );
  }, [salons, search]);

  const goToSalon = (salon: Salon) => router.push(`/salon/${salon.id}`);

  const header = (
    <FindHeader
      search={search}
      onChangeSearch={setSearch}
      view={view}
      onChangeView={setView}
      city={city}
      onSelectCity={setCity}
    />
  );

  // Empty / loading / error are handled at the screen level (not via the list's
  // ListEmptyComponent, which collapses to zero height when data is empty).
  const isEmpty = filtered.length === 0;

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
    content = <SalonMap salons={filtered} city={city} onPressSalon={goToSalon} />;
  } else {
    content = (
      <SalonList
        salons={filtered}
        onPressSalon={goToSalon}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        isLoadingMore={isFetchingNextPage}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
      />
    );
  }

  return (
    <GScreen edges={['top']} padded={false}>
      <View style={styles.header}>{header}</View>
      <View style={styles.content}>{content}</View>
    </GScreen>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: 8 },
  content: { flex: 1 },
});
