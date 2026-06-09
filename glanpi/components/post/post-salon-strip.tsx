import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { GAvatar, GCard, GRatingBadge, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type PostSalonStripProps = {
  name: string;
  city: string;
  /** Rating fills in once `useSalon` resolves; undefined → hidden (no block). */
  rating?: number;
  reviewCount?: number;
  avatarUrl?: string;
  onPress: () => void;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Pressable salon row on Post Detail. Shows name + city immediately and the
 * rating once enrichment resolves (graceful, never blocks the photo). Press →
 * Salon Detail (the screen prefetches its queries first — plan §8.6).
 */
export function PostSalonStrip({
  name,
  city,
  rating,
  reviewCount,
  avatarUrl,
  onPress,
}: PostSalonStripProps) {
  const { app } = useAppTheme();

  return (
    <GCard onPress={onPress} padding="md">
      <View style={styles.row}>
        <GAvatar size={44} uri={avatarUrl} initials={initials(name)} />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <GText variant="bodyStrong" numberOfLines={1} style={styles.name}>
              {name}
            </GText>
            {rating != null && rating > 0 && (
              <GRatingBadge rating={rating} reviewCount={reviewCount} />
            )}
          </View>
          <GText variant="caption" color="muted" numberOfLines={1}>
            {city}
          </GText>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={app.colors.textFaint}
        />
      </View>
    </GCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flexShrink: 1 },
});
