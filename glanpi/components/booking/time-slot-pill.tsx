import { StyleSheet, View } from 'react-native';

import { GPressable, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type TimeSlotPillProps = {
  time: string; // "09:00"
  selected: boolean;
  onPress: () => void;
};

/** One bookable time slot. Selected = accent fill (design §5.2). */
export function TimeSlotPill({ time, selected, onPress }: TimeSlotPillProps) {
  const { app } = useAppTheme();

  return (
    <GPressable onPress={onPress} borderless={false} style={styles.wrap}>
      <View
        accessibilityRole="button"
        accessibilityLabel={`${time}, dostępny termin`}
        accessibilityState={{ selected }}
        style={[
          styles.pill,
          {
            backgroundColor: selected ? app.colors.accent : app.colors.surface,
            borderColor: selected ? app.colors.accent : app.colors.outline,
            borderRadius: app.radius.pill,
          },
        ]}
      >
        <GText variant="label" color={selected ? 'onPrimary' : 'default'}>
          {time}
        </GText>
      </View>
    </GPressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  pill: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
