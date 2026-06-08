import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { GChip } from '@/components/ui';
import { spacing } from '@/theme';
import type { PostType } from '@/api';

type CategoryOption = { value?: PostType; labelKey: string };

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: undefined, labelKey: 'explore.category.all' },
  { value: 'hair', labelKey: 'explore.category.hair' },
  { value: 'makeup', labelKey: 'explore.category.makeup' },
  { value: 'nails', labelKey: 'explore.category.nails' },
  { value: 'skin', labelKey: 'explore.category.skin' },
];

export type ExploreCategoryFiltersProps = {
  postType?: PostType;
  onChangePostType: (postType?: PostType) => void;
};

/**
 * Horizontal chip row for explore feed filtering. Self-contained: owns the
 * category list and translations. Used in both the expanded `ExploreHeader` and
 * the compact scroll overlay so filters are always reachable.
 */
export function ExploreCategoryFilters({ postType, onChangePostType }: ExploreCategoryFiltersProps) {
  const { t } = useTranslation();

  const categories = useMemo(
    () => CATEGORY_OPTIONS.map((opt) => ({ ...opt, label: t(opt.labelKey) })),
    [t],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {categories.map((opt) => (
        <GChip
          key={opt.labelKey}
          label={opt.label}
          selected={opt.value === postType}
          onPress={() => onChangePostType(opt.value)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
});
