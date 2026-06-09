import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateRangeStrip, TimeRangeField, type DateRangeItem } from '@/components/find';
import { GBottomBar, GButton, GIconButton, GScreen, GText } from '@/components/ui';
import { buildDateStrip, formatShortDate } from '@/lib/datetime';
import { useFindFilters, type SalonFilters } from '@/providers/find-filters-provider';
import { useAppTheme } from '@/theme';

const DATE_COUNT = 30;

/**
 * Find · availability filters (modal). Edits a local draft seeded from the
 * applied filters, so closing without "Pokaż wyniki" discards changes. Date is a
 * start→end range picked on the strip; time is an optional wall-clock window.
 * Committing writes to `FindFiltersProvider`, which the Find list observes.
 */
export default function FindFiltersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { app } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { filters, setFilters, clear } = useFindFilters();

  const [draft, setDraft] = useState<SalonFilters>(filters);

  const dateItems = useMemo<DateRangeItem[]>(
    () =>
      buildDateStrip(DATE_COUNT).map((d) => ({
        date: d.date,
        weekday: d.isToday ? t('find.filters.today') : d.weekdayShort,
        day: d.dayNumber,
        label: `${d.weekdayShort} ${d.dayNumber}`,
      })),
    [t],
  );

  // Range selection: first tap sets the start (clearing any end); the next tap
  // sets the end, or restarts if it lands before the start.
  const onPressDay = (date: string) => {
    setDraft((d) => {
      if (!d.dateFrom || d.dateTo) return { ...d, dateFrom: date, dateTo: undefined };
      if (date < d.dateFrom) return { ...d, dateFrom: date, dateTo: undefined };
      return { ...d, dateTo: date };
    });
  };

  const onChangeTime = (next: { from?: string; to?: string }) =>
    setDraft((d) => ({ ...d, timeFrom: next.from, timeTo: next.to }));

  const dateSummary = draft.dateFrom
    ? draft.dateTo && draft.dateTo !== draft.dateFrom
      ? `${formatShortDate(draft.dateFrom)} – ${formatShortDate(draft.dateTo)}`
      : formatShortDate(draft.dateFrom)
    : t('find.filters.anyDate');

  const onClear = () => {
    setDraft({});
    clear();
    router.back();
  };

  const onApply = () => {
    setFilters(draft);
    router.back();
  };

  return (
    <GScreen edges={[]} padded={false} tone="background">
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + app.spacing.xs, paddingHorizontal: app.spacing.lg },
        ]}
      >
        <View style={styles.side}>
          <GIconButton
            icon="close"
            size={22}
            onPress={() => router.back()}
            accessibilityLabel={t('common.close')}
          />
        </View>
        <GText variant="titleSmall" style={styles.title}>
          {t('find.filters.title')}
        </GText>
        <View style={styles.side} />
      </View>

      <View style={[styles.body, { gap: app.spacing.xl, paddingVertical: app.spacing.lg }]}>
        <View style={{ gap: app.spacing.sm }}>
          <View style={[styles.sectionHead, { paddingHorizontal: app.spacing.lg }]}>
            <GText variant="titleSmall">{t('find.filters.dateLabel')}</GText>
            <GText variant="caption" color="muted">
              {dateSummary}
            </GText>
          </View>
          <DateRangeStrip
            items={dateItems}
            from={draft.dateFrom}
            to={draft.dateTo}
            onPressDay={onPressDay}
          />
        </View>

        <View style={{ paddingHorizontal: app.spacing.lg }}>
          <TimeRangeField from={draft.timeFrom} to={draft.timeTo} onChange={onChangeTime} />
        </View>
      </View>

      <GBottomBar
        summary={
          <GButton kind="text" label={t('find.filters.clear')} onPress={onClear} />
        }
      >
        <GButton label={t('find.filters.apply')} onPress={onApply} testID="find-filters-apply" />
      </GBottomBar>
    </GScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  side: { width: 44, alignItems: 'flex-start' },
  title: { flex: 1, textAlign: 'center' },
  body: { flex: 1 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
});
