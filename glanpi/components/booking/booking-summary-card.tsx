import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { GCard, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type BookingSummaryCardProps = {
  salonName: string;
  serviceName: string;
  /** Pre-formatted, e.g. "120 min". */
  duration?: string;
  /** "z Anną Kowalską" — staff line, optional. */
  staffLine?: string;
  /** "Wt, 12 cze · 09:00" — date+time in the salon timezone. */
  dateTimeLabel: string;
  /** "320 zł" or null. */
  price?: string | null;
  address?: string;
};

/** Shared booking summary (Review + Confirmation). Salon, service, staff, when. */
export function BookingSummaryCard({
  salonName,
  serviceName,
  duration,
  staffLine,
  dateTimeLabel,
  price,
  address,
}: BookingSummaryCardProps) {
  const { app } = useAppTheme();

  return (
    <GCard padding="lg">
      <View style={{ gap: app.spacing.sm }}>
        <GText variant="titleSmall">{salonName}</GText>

        <GText variant="body">
          {[serviceName, duration].filter(Boolean).join(' · ')}
        </GText>

        {staffLine && (
          <GText variant="body" color="muted">
            {staffLine}
          </GText>
        )}

        <Row icon="calendar-clock" text={dateTimeLabel} />
        {price != null && <Row icon="cash" text={price} />}
        {address && <Row icon="map-marker-outline" text={address} />}
      </View>
    </GCard>
  );
}

function Row({ icon, text }: { icon: string; text: string }) {
  const { app } = useAppTheme();
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon as never} size={16} color={app.colors.textMuted} />
      <GText variant="body" style={styles.rowText}>
        {text}
      </GText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { flexShrink: 1 },
});
