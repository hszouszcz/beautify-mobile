import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

export type GStepProgressProps = {
  /** Total number of segments. */
  steps: number;
  /** Zero-based index of the current step; segments ≤ current are filled. */
  current: number;
};

/**
 * Thin segmented progress bar (booking flow chrome). `accent` fill for
 * completed/active segments, `backgroundStrong` track for the rest. Pure
 * layout/token component — no Paper.
 */
export function GStepProgress({ steps, current }: GStepProgressProps) {
  const { app } = useAppTheme();

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: steps, now: current + 1 }}
    >
      {Array.from({ length: steps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            {
              backgroundColor:
                i <= current ? app.colors.accent : app.colors.backgroundStrong,
              borderRadius: app.radius.pill,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4 },
});
