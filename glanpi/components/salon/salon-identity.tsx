import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { GButton, GRatingBadge, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type SalonIdentityProps = {
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  /** Pre-resolved open-now pill (screen owns the i18n copy). */
  openNow?: { label: string; tone: 'success' | 'muted' };
  callLabel: string;
  directionsLabel: string;
  onCall?: () => void;
  onDirections?: () => void;
};

/** Salon name + rating + address + call/directions actions + open-now pill. */
export function SalonIdentity({
  name,
  rating,
  reviewCount,
  address,
  openNow,
  callLabel,
  directionsLabel,
  onCall,
  onDirections,
}: SalonIdentityProps) {
  const { app } = useAppTheme();

  return (
    <View style={{ gap: app.spacing.sm }}>
      <GText variant="title">{name}</GText>

      <GRatingBadge rating={rating} reviewCount={reviewCount} size={16} />

      <View style={styles.addressRow}>
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={14}
          color={app.colors.textMuted}
        />
        <GText variant="caption" color="muted" style={styles.address}>
          {address}
        </GText>
      </View>

      <View style={[styles.actions, { marginTop: app.spacing.xs }]}>
        {onCall && <GButton kind="secondary" label={callLabel} icon="phone" onPress={onCall} />}
        {onDirections && (
          <GButton kind="text" label={directionsLabel} icon="map-outline" onPress={onDirections} />
        )}
      </View>

      {openNow && (
        <View style={styles.openRow}>
          <View
            style={[
              styles.openDot,
              {
                backgroundColor:
                  openNow.tone === 'success' ? app.colors.success : app.colors.textFaint,
              },
            ]}
          />
          <GText variant="label" color={openNow.tone === 'success' ? 'default' : 'muted'}>
            {openNow.label}
          </GText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  openDot: { width: 8, height: 8, borderRadius: 4 },
});
