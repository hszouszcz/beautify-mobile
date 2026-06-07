import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Menu } from 'react-native-paper';

import { GChip, GSearchBar, GText } from '@/components/ui';
import { CITIES } from '@/constants/cities';
import { useAppTheme } from '@/theme';
import type { PostType } from '@/api';

export type ExploreHeaderProps = {
  city: string;
  onSelectCity: (city: string) => void;
  /** Active category filter (`post_type`); `undefined` = all categories. */
  postType?: PostType;
  onChangePostType: (postType?: PostType) => void;
};

type CategoryOption = { value?: PostType; labelKey: string };

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: undefined, labelKey: 'explore.category.all' },
  { value: 'hair', labelKey: 'explore.category.hair' },
  { value: 'makeup', labelKey: 'explore.category.makeup' },
  { value: 'nails', labelKey: 'explore.category.nails' },
  { value: 'skin', labelKey: 'explore.category.skin' },
];

/**
 * Fixed Explore header: brand title, tappable city selector (anchored Menu),
 * an inspiration search field, and a horizontal category-filter chip row that
 * drives the feed's `post_type`.
 *
 * NOTE: full-text search is out of MVP scope (no backend endpoint), so the
 * search field is a visual placeholder and does not yet filter the feed.
 */
export function ExploreHeader({
  city,
  onSelectCity,
  postType,
  onChangePostType,
}: ExploreHeaderProps) {
  const { t } = useTranslation();
  const { app } = useAppTheme();
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const categories = useMemo(
    () =>
      CATEGORY_OPTIONS.map((opt) => ({
        ...opt,
        label: t(opt.labelKey),
      })),
    [t],
  );

  return (
    <View style={[styles.root, { paddingHorizontal: app.spacing.lg, gap: app.spacing.md }]}>
      <View style={styles.titleRow}>
        <GText variant="display">{t('explore.title')}</GText>

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
      </View>

      <GSearchBar
        placeholder={t('explore.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
      />

      <View style={[styles.categories, { gap: app.spacing.sm }]}>
        {categories.map((opt) => (
          <GChip
            key={opt.labelKey}
            label={opt.label}
            selected={opt.value === postType}
            onPress={() => onChangePostType(opt.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  categories: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 2 },
});
