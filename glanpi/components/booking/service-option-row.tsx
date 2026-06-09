import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { GPressable, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type ServiceOptionRowProps = {
  name: string;
  /** Pre-formatted, e.g. "120 min". */
  duration: string;
  /** Pre-formatted price, e.g. "320 zł", or null. */
  price?: string | null;
  selected: boolean;
  /** Show the "Ze zdjęcia" chip (came preselected from a post). */
  fromPost?: boolean;
  fromPostLabel: string;
  onPress: () => void;
};

/** Single-select service row (radio semantics) for booking Step 1 (design §5.1). */
export function ServiceOptionRow({
  name,
  duration,
  price,
  selected,
  fromPost,
  fromPostLabel,
  onPress,
}: ServiceOptionRowProps) {
  const { app } = useAppTheme();

  return (
    <GPressable
      onPress={onPress}
      borderless={false}
      style={[
        styles.row,
        {
          paddingVertical: app.spacing.md,
          paddingLeft: app.spacing.md,
          borderLeftWidth: 3,
          borderLeftColor: selected ? app.colors.accent : 'transparent',
        },
      ]}
    >
      <MaterialCommunityIcons
        name={selected ? 'radiobox-marked' : 'radiobox-blank'}
        size={22}
        color={selected ? app.colors.accent : app.colors.textFaint}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <GText variant="bodyStrong" numberOfLines={1} style={styles.name}>
            {name}
          </GText>
          {fromPost && (
            <View style={[styles.chip, { backgroundColor: app.colors.backgroundStrong }]}>
              <GText variant="caption" color="muted">
                {fromPostLabel}
              </GText>
            </View>
          )}
        </View>
        <GText variant="caption" color="muted">
          {[duration, price].filter(Boolean).join(' · ')}
        </GText>
      </View>
    </GPressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1 },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
});
