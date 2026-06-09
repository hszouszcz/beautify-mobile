import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { GPressable, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type ServiceListRowProps = {
  name: string;
  /** Pre-formatted, e.g. "45 min". */
  duration: string;
  /** Pre-formatted price, e.g. "120 zł", or null when unset. */
  price?: string | null;
  onPress: () => void;
};

/**
 * A bookable service row on Salon Detail: name / duration / price / ⊕ add
 * affordance. Tapping books that service (preselected).
 */
export function ServiceListRow({ name, duration, price, onPress }: ServiceListRowProps) {
  const { app } = useAppTheme();

  return (
    <GPressable
      onPress={onPress}
      borderless={false}
      style={[styles.row, { paddingVertical: app.spacing.md }]}
    >
      <View style={styles.info}>
        <GText variant="bodyStrong" numberOfLines={1}>
          {name}
        </GText>
        <GText variant="caption" color="muted">
          {duration}
        </GText>
      </View>

      <View style={styles.trailing}>
        {price != null && <GText variant="body">{price}</GText>}
        <MaterialCommunityIcons
          name="plus-circle-outline"
          size={24}
          color={app.colors.accent}
        />
      </View>
    </GPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  info: { flexShrink: 1, gap: 2 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
