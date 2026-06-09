import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Menu } from 'react-native-paper';

import { AppHeader } from '@/components/layout';
import { GChip, GSearchBar, GText } from '@/components/ui';
import { CITIES } from '@/constants/cities';
import type { SalonFilters } from '@/providers/find-filters-provider';
import { useAppTheme } from '@/theme';

import { FilterButton } from './filter-button';

export type FindView = 'list' | 'map';

export type FindHeaderProps = {
  /** Current search text (client-side filter over loaded salons). */
  search: string;
  onChangeSearch: (value: string) => void;
  city: string;
  onSelectCity: (city: string) => void;
  /** Applied availability filters — summarised on the filter chip. */
  filters: SalonFilters;
  /** Opens the filters sheet. */
  onOpenFilters: () => void;
  /** Clears all filters (trailing ✕ on the active filter chip). */
  onClearFilters: () => void;
  /** Total matches for the active query (envelope `count`); hidden while loading. */
  resultCount?: number;
};

/**
 * Find-tab header — composes `AppHeader` so it matches Explore: serif title with
 * the city selector (location context) in the trailing slot, the full-width
 * search bar, then a single self-describing filter chip. List ↔ Map is a
 * floating pill over the results (`FindViewToggle`), not part of the header. The
 * search field drives the server-side `q` query; the result count sits under the
 * filter chip.
 */
export function FindHeader({
  search,
  onChangeSearch,
  city,
  onSelectCity,
  filters,
  onOpenFilters,
  onClearFilters,
  resultCount,
}: FindHeaderProps) {
  const { t } = useTranslation();
  const { app } = useAppTheme();
  const [cityMenuOpen, setCityMenuOpen] = useState(false);

  return (
    <AppHeader
      title={t('find.title')}
      trailing={
        <Menu
          visible={cityMenuOpen}
          onDismiss={() => setCityMenuOpen(false)}
          anchor={
            <GChip label={city} icon="map-marker" onPress={() => setCityMenuOpen(true)} />
          }
          contentStyle={{ backgroundColor: app.colors.surface }}
        >
          {CITIES.map((c) => (
            <Menu.Item
              key={c}
              title={c}
              titleStyle={{ color: app.colors.text }}
              onPress={() => {
                onSelectCity(c);
                setCityMenuOpen(false);
              }}
            />
          ))}
        </Menu>
      }
      search={
        <GSearchBar
          placeholder={t('find.searchPlaceholder')}
          value={search}
          onChangeText={onChangeSearch}
        />
      }
      filters={
        <View style={styles.filterColumn}>
          <View style={styles.filterRow}>
            <FilterButton filters={filters} onPress={onOpenFilters} onClear={onClearFilters} />
          </View>
          {resultCount != null && (
            <GText variant="caption" color="muted">
              {t('find.resultCount', { count: resultCount })}
            </GText>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  // Column stacks the filter chip over the result-count caption.
  filterColumn: { gap: 4 },
  // Row so the single chip keeps its intrinsic width / left edge (the header's
  // column would otherwise stretch it full-width).
  filterRow: { flexDirection: 'row' },
});
