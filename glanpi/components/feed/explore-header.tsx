import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu } from 'react-native-paper';

import { AppHeader } from '@/components/layout';
import { GChip, GSearchBar } from '@/components/ui';
import { CITIES } from '@/constants/cities';
import { useAppTheme } from '@/theme';
import type { PostType } from '@/api';

import { ExploreCategoryFilters, type ChipScrollSync } from './explore-category-filters';

export type ExploreHeaderProps = {
  city: string;
  onSelectCity: (city: string) => void;
  /** Active category filter (`post_type`); `undefined` = all categories. */
  postType?: PostType;
  onChangePostType: (postType?: PostType) => void;
  /** Shared chip-scroll state so the filter row aligns with the compact overlay. */
  categoryScrollSync?: ChipScrollSync;
};

/**
 * Explore-specific header: brand title, tappable city selector, inspiration
 * search field, and category filters. Composes `AppHeader`; owns only the
 * city-menu and search-text state.
 *
 * NOTE: full-text search is out of MVP scope — the search field is a visual
 * placeholder and does not yet filter the feed.
 */
export function ExploreHeader({
  city,
  onSelectCity,
  postType,
  onChangePostType,
  categoryScrollSync,
}: ExploreHeaderProps) {
  const { t } = useTranslation();
  const { app } = useAppTheme();
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <AppHeader
      title={t('explore.title')}
      trailing={
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
      }
      search={
        <GSearchBar
          placeholder={t('explore.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
        />
      }
      filters={
        <ExploreCategoryFilters
          postType={postType}
          onChangePostType={onChangePostType}
          sync={categoryScrollSync}
        />
      }
    />
  );
}
