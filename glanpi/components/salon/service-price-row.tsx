import { StyleSheet, View } from 'react-native';

import { GText } from '@/components/ui';

export type ServicePriceRowProps = {
  name: string;
  /** Pre-formatted price string (e.g. "55$"), or null when no price set. */
  price?: string | null;
};

/**
 * One service line on a salon card, e.g. "Classic Manicure · 55$".
 * Price is pre-formatted by the caller (currency/i18n).
 */
export function ServicePriceRow({ name, price }: ServicePriceRowProps) {
  return (
    <View style={styles.row}>
      <GText variant="body" color="muted" numberOfLines={1} style={styles.name}>
        {name}
      </GText>
      {price != null && (
        <GText variant="body" color="muted">
          · {price}
        </GText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { flexShrink: 1 },
});
