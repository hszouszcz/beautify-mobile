import { StyleSheet, View } from 'react-native';

import { GPressable, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type DatePillProps = {
  weekday: string; // "pt"
  day: string; // "13"
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

/** One day cell in the booking date strip. Selected = accent fill. */
export function DatePill({
  weekday,
  day,
  selected,
  disabled,
  onPress,
  accessibilityLabel,
}: DatePillProps) {
  const { app } = useAppTheme();

  const bg = selected ? app.colors.accent : app.colors.surface;
  const textColor = selected ? 'onPrimary' : disabled ? 'faint' : 'default';

  return (
    <GPressable onPress={disabled ? undefined : onPress} disabled={disabled} borderless={false}>
      <View
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected, disabled }}
        style={[
          styles.pill,
          {
            backgroundColor: bg,
            borderRadius: app.radius.lg,
            borderColor: app.colors.outline,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        <GText variant="caption" color={textColor}>
          {weekday}
        </GText>
        <GText variant="bodyStrong" color={textColor}>
          {day}
        </GText>
      </View>
    </GPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 56,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
