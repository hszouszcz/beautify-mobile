import { useTranslation } from 'react-i18next';

import { GChip } from '@/components/ui';
import { compactClock, formatDateRangeShort } from '@/lib/datetime';
import type { SalonFilters } from '@/providers/find-filters-provider';

export type FilterButtonProps = {
  /** Applied availability filters — drive the chip's label + selected state. */
  filters: SalonFilters;
  /** Open the filters sheet. */
  onPress: () => void;
  /** Clear all filters — shows a trailing ✕ on the chip while filters are active. */
  onClear: () => void;
};

/**
 * Single Find-header entry to the filters sheet. Reads "Filtry" when nothing is
 * set; once any facet is applied it fills brand brown, previews the active
 * values inline (e.g. "12–16 cze · 9–14"), and grows a trailing ✕ that clears
 * everything without opening the sheet — so the header always says what's
 * narrowing results and lets you undo it in one tap.
 */
export function FilterButton({ filters, onPress, onClear }: FilterButtonProps) {
  const { t } = useTranslation();

  const summary = buildSummary(filters, t);
  const active = summary != null;

  return (
    <GChip
      icon="tune-variant"
      label={active ? summary : t('find.filters.title')}
      selected={active}
      onPress={onPress}
      accessibilityLabel={t('find.filters.open')}
      closeIcon="close"
      onClose={active ? onClear : undefined}
      closeIconAccessibilityLabel={t('find.filters.clear')}
    />
  );
}

/** Compact "date · time" preview, or `null` when no facet is set. */
function buildSummary(
  f: SalonFilters,
  t: (key: string) => string,
): string | null {
  const parts: string[] = [];

  if (f.dateFrom) parts.push(formatDateRangeShort(f.dateFrom, f.dateTo));

  if (f.timeFrom && f.timeTo) {
    parts.push(`${compactClock(f.timeFrom)}–${compactClock(f.timeTo)}`);
  } else if (f.timeFrom) {
    parts.push(`${t('find.filters.timeFrom')} ${compactClock(f.timeFrom)}`);
  } else if (f.timeTo) {
    parts.push(`${t('find.filters.timeTo')} ${compactClock(f.timeTo)}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}
