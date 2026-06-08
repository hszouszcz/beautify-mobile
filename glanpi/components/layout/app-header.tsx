import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type AppHeaderProps = {
  /** Screen or section title. */
  title: string;
  /** Leading slot: back button, logo, avatar. */
  leading?: ReactNode;
  /** Trailing slot: city chip, settings icon, action buttons. */
  trailing?: ReactNode;
  /**
   * Below-title slot: search bar. Rendered only in expanded mode (`compact=false`).
   * Typically a `GSearchBar`.
   */
  search?: ReactNode;
  /**
   * Below-search slot: filter chips, segmented control. Rendered in both expanded
   * and compact modes — keeping filters reachable while scrolling.
   */
  filters?: ReactNode;
  /**
   * Compact (sticky overlay) rendering: shows only the title row with a smaller
   * text variant. Wrap in `Animated.View` with `compactBarStyle` from
   * `useCollapsingHeader` to drive the scroll-triggered appearance.
   */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Universal screen header — slot-based, works standalone or inside
 * `useCollapsingHeader`'s animated overlay.
 *
 * Expanded (default): large serif title + all slots visible.
 * Compact: condensed title row only — used as the scroll-triggered sticky bar.
 */
export function AppHeader({
  title,
  leading,
  trailing,
  search,
  filters,
  compact = false,
  style,
}: AppHeaderProps) {
  const { app } = useAppTheme();

  return (
    <View
      style={[
        styles.root,
        {
          paddingHorizontal: app.spacing.lg,
          // Compact: default sm vertical padding; callers override paddingTop for safe
          // area. Expanded: no vertical padding — the screen/list owns that rhythm.
          paddingVertical: compact ? app.spacing.sm : 0,
          gap: app.spacing.md,
        },
        style,
      ]}
    >
      <View style={styles.titleRow}>
        {leading != null && <View style={styles.leadingSlot}>{leading}</View>}
        <GText
          variant={compact ? 'title' : 'display'}
          align={compact ? 'center' : undefined}
          numberOfLines={1}
          style={[styles.title, compact && styles.compactTitle]}
        >
          {title}
        </GText>
        {trailing != null && <View style={styles.trailingSlot}>{trailing}</View>}
      </View>

      {!compact && search}
      {filters}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  leadingSlot: { flexShrink: 0 },
  title: { flex: 1 },
  compactTitle: { fontWeight: '700' },
  trailingSlot: { flexShrink: 0 },
});
