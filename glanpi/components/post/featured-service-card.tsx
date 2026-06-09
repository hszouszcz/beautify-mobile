import { StyleSheet, View } from 'react-native';

import { GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type FeaturedServiceCardProps = {
  /** Section label, e.g. "Usługa ze zdjęcia". */
  label: string;
  serviceName: string;
  /** Pre-formatted meta line, e.g. "90 min · 320 zł". */
  meta: string;
};

/**
 * Accent-tinted card surfacing the post's featured service — the service that
 * lands preselected when the user taps "Zarezerwuj" (design §3).
 */
export function FeaturedServiceCard({ label, serviceName, meta }: FeaturedServiceCardProps) {
  const { app } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: app.colors.backgroundStrong,
          borderRadius: app.radius.lg,
          padding: app.spacing.md,
          borderColor: app.colors.accent,
        },
      ]}
    >
      <GText variant="caption" color="muted">
        {label}
      </GText>
      <GText variant="bodyStrong">{serviceName}</GText>
      <GText variant="caption" color="muted">
        {meta}
      </GText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 2, borderLeftWidth: 3 },
});
