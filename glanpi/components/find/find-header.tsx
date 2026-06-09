import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Menu } from 'react-native-paper';

import { GChip, GSearchBar, GSegmentedControl } from '@/components/ui';
import { CITIES } from '@/constants/cities';
import { useAppTheme } from '@/theme';

import { FilterTrigger } from './filter-trigger';

export type FindView = 'list' | 'map';

export type FindHeaderProps = {
  /** Current search text (client-side filter over loaded salons). */
  search: string;
  onChangeSearch: (value: string) => void;
  view: FindView;
  onChangeView: (view: FindView) => void;
  city: string;
  onSelectCity: (city: string) => void;
  /** Active availability-filter count, and the handler that opens the sheet. */
  filterCount: number;
  onOpenFilters: () => void;
};

/**
 * Find-tab header, stacked for a clear "where → what → how" hierarchy: the city
 * selector (location context) on its own row, then the full-width search bar,
 * then the full-width List/Map toggle (matches the mockup). The search field
 * filters loaded results client-side — full-text search is post-MVP.
 */
export function FindHeader({
  search,
  onChangeSearch,
  view,
  onChangeView,
  city,
  onSelectCity,
  filterCount,
  onOpenFilters,
}: FindHeaderProps) {
  const { t } = useTranslation();
  const { app } = useAppTheme();
  const [cityMenuOpen, setCityMenuOpen] = useState(false);

  return (
    <View style={[styles.root, { paddingHorizontal: app.spacing.lg, gap: app.spacing.md }]}>
      <View style={[styles.cityRow, { gap: app.spacing.sm }]}>
        <Menu
          visible={cityMenuOpen}
          onDismiss={() => setCityMenuOpen(false)}
          anchor={
            <GChip
              label={city}
              icon="map-marker"
              onPress={() => setCityMenuOpen(true)}
            />
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

        <FilterTrigger count={filterCount} onPress={onOpenFilters} />
      </View>

      <GSearchBar
        placeholder={t('find.searchPlaceholder')}
        value={search}
        onChangeText={onChangeSearch}
      />

      <GSegmentedControl<FindView>
        value={view}
        onChange={onChangeView}
        options={[
          { value: 'list', label: t('find.tab.list'), icon: 'view-list' },
          { value: 'map', label: t('find.tab.map'), icon: 'map-outline' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  cityRow: { flexDirection: 'row', alignItems: 'center' },
});
