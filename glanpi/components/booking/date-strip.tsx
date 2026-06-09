import { LegendList } from '@legendapp/list/react-native';

import { useAppTheme } from '@/theme';

import { DatePill } from './date-pill';

export type DateStripItemModel = {
  date: string; // YYYY-MM-DD
  weekday: string;
  day: string;
  disabled: boolean;
  label: string; // accessibility label
};

export type DateStripProps = {
  items: DateStripItemModel[];
  selectedDate: string | undefined;
  onSelect: (date: string) => void;
  onEndReached?: () => void;
};

/** Horizontal date strip (design §5.2 / D4) — a LegendList of DatePills. */
export function DateStrip({ items, selectedDate, onSelect, onEndReached }: DateStripProps) {
  const { app } = useAppTheme();

  return (
    <LegendList
      data={items}
      keyExtractor={(item) => item.date}
      // `selected` depends on `selectedDate`, which lives outside `item`; without
      // extraData LegendList memoizes the pills and the highlight never moves on tap.
      extraData={selectedDate}
      horizontal
      showsHorizontalScrollIndicator={false}
      estimatedItemSize={64}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{ gap: app.spacing.sm, paddingHorizontal: app.spacing.lg }}
      renderItem={({ item }) => (
        <DatePill
          weekday={item.weekday}
          day={item.day}
          selected={item.date === selectedDate}
          disabled={item.disabled}
          onPress={() => onSelect(item.date)}
          accessibilityLabel={item.label}
        />
      )}
    />
  );
}
