import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme';

export type GBottomBarProps = {
  /** Optional left-aligned content (e.g. the running booking summary). */
  summary?: React.ReactNode;
  /** The action(s) — a `GButton` (or row of buttons). */
  children: React.ReactNode;
};

/**
 * Sticky bottom action bar. Surface background, top hairline, `raised`
 * elevation, and honors the bottom safe-area inset. Used on Post/Salon detail
 * and every booking step. When `summary` is present it sits on the left and the
 * action shrinks to fit; otherwise the action stretches full-width.
 */
export function GBottomBar({ summary, children }: GBottomBarProps) {
  const insets = useSafeAreaInsets();
  const { app } = useAppTheme();

  return (
    <View
      style={[
        styles.bar,
        app.elevation.raised,
        {
          backgroundColor: app.colors.surface,
          borderTopColor: app.colors.outline,
          paddingHorizontal: app.spacing.lg,
          paddingTop: app.spacing.md,
          paddingBottom: insets.bottom + app.spacing.md,
          gap: app.spacing.md,
        },
      ]}
    >
      {summary ? <View style={styles.summary}>{summary}</View> : null}
      <View style={summary ? undefined : styles.fullAction}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  summary: { flexShrink: 1 },
  fullAction: { flex: 1 },
});
