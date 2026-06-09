import { useTranslation } from 'react-i18next';

import { GChip } from '@/components/ui';

export type FilterTriggerProps = {
  /** Number of active filter facets — appended as a count and fills the chip. */
  count: number;
  onPress: () => void;
};

/**
 * Find-header entry point to the filter sheet. Reads as a normal chip when no
 * filters are set; fills with the accent and shows a count once any are active,
 * so the header always reflects whether results are being narrowed.
 */
export function FilterTrigger({ count, onPress }: FilterTriggerProps) {
  const { t } = useTranslation();
  const active = count > 0;

  return (
    <GChip
      icon="tune-variant"
      label={active ? `${t('find.filters.title')} · ${count}` : t('find.filters.title')}
      selected={active}
      onPress={onPress}
      accessibilityLabel={t('find.filters.open')}
    />
  );
}
