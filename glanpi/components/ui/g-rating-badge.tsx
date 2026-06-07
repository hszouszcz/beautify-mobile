import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { GText } from './g-text';

export type GRatingBadgeProps = {
  rating: number;
  reviewCount?: number;
  size?: number;
};

/**
 * Amber star + score + optional "(210 reviews)" — used on salon cards/detail.
 * Review count text is passed pre-formatted by the caller (i18n/pluralization).
 */
export function GRatingBadge({ rating, reviewCount, size = 14 }: GRatingBadgeProps) {
  const { app } = useAppTheme();

  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name="star" size={size} color={app.colors.star} />
      <GText variant="label" color="default">
        {rating.toFixed(1)}
      </GText>
      {reviewCount !== undefined && (
        <GText variant="caption" color="muted">
          ({reviewCount})
        </GText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
