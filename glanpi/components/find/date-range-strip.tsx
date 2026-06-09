import { LegendList } from '@legendapp/list/react-native';
import { StyleSheet, View } from 'react-native';

import { GPressable, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type DateRangeItem = {
  date: string; // YYYY-MM-DD
  weekday: string; // "pt"
  day: string; // "13"
  label: string; // accessibility label
};

type DayState = 'none' | 'start' | 'end' | 'single' | 'inRange';

export type DateRangeStripProps = {
  items: DateRangeItem[];
  from: string | undefined; // YYYY-MM-DD
  to: string | undefined; // YYYY-MM-DD (inclusive)
  onPressDay: (date: string) => void;
  onEndReached?: () => void;
};

/** Per-day visual state from the current [from, to] range (string compare is safe for ISO dates). */
function dayState(date: string, from?: string, to?: string): DayState {
  if (!from) return 'none';
  if (!to) return date === from ? 'single' : 'none';
  if (from === to) return date === from ? 'single' : 'none';
  if (date === from) return 'start';
  if (date === to) return 'end';
  if (date > from && date < to) return 'inRange';
  return 'none';
}

/**
 * Horizontal date strip with range selection for the Find filter sheet. Tapping
 * sets the start, then the end; in-between days get a soft fill so the span
 * reads at a glance. Presentational — the range logic (start→end, reset) lives
 * in the filter screen and is passed back via `onPressDay`.
 */
export function DateRangeStrip({ items, from, to, onPressDay, onEndReached }: DateRangeStripProps) {
  const { app } = useAppTheme();

  return (
    <LegendList
      data={items}
      keyExtractor={(item) => item.date}
      extraData={`${from}|${to}`}
      horizontal
      showsHorizontalScrollIndicator={false}
      estimatedItemSize={56}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{ gap: app.spacing.xs, paddingHorizontal: app.spacing.lg }}
      renderItem={({ item }) => {
        const state = dayState(item.date, from, to);
        const filled = state === 'start' || state === 'end' || state === 'single';
        const bg = filled
          ? app.colors.accent
          : state === 'inRange'
            ? app.colors.backgroundStrong
            : app.colors.surface;
        const textColor = filled ? 'onPrimary' : 'default';

        return (
          <GPressable onPress={() => onPressDay(item.date)} borderless={false}>
            <View
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: state !== 'none' }}
              style={[
                styles.pill,
                {
                  backgroundColor: bg,
                  borderRadius: app.radius.lg,
                  borderColor: filled ? app.colors.accent : app.colors.outline,
                },
              ]}
            >
              <GText variant="caption" color={textColor}>
                {item.weekday}
              </GText>
              <GText variant="bodyStrong" color={textColor}>
                {item.day}
              </GText>
            </View>
          </GPressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 52,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
