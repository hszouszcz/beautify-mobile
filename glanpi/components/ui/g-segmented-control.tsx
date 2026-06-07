import { StyleSheet } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { useAppTheme } from '@/theme';

export type GSegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: string;
};

export type GSegmentedControlProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: GSegmentOption<T>[];
  style?: object;
};

/**
 * Pill segmented toggle (e.g. List ↔ Map). Active segment fills with the brand
 * brown and shows a light label; inactive segments read muted on the strong
 * beige track.
 */
export function GSegmentedControl<T extends string>({
  value,
  onChange,
  options,
  style,
}: GSegmentedControlProps<T>) {
  const { app } = useAppTheme();

  return (
    <SegmentedButtons
      value={value}
      onValueChange={(v) => onChange(v as T)}
      density="medium"
      style={[
        styles.track,
        { backgroundColor: app.colors.backgroundStrong, borderRadius: app.radius.pill },
        style,
      ]}
      theme={{ roundness: app.radius.pill / 8 }}
      buttons={options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        icon: opt.icon,
        showSelectedCheck: false,
        style: [
          styles.segment,
          {
            backgroundColor: opt.value === value ? app.colors.accent : 'transparent',
            borderColor: 'transparent',
            borderRadius: app.radius.pill,
          },
        ],
        labelStyle: {
          color: opt.value === value ? app.colors.onAccent : app.colors.textMuted,
        },
      }))}
    />
  );
}

const styles = StyleSheet.create({
  track: { padding: 4 },
  segment: { borderWidth: 0 },
});
