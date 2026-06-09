import { StyleSheet, View } from 'react-native';

import { GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type BusinessHoursRow = {
  id: string;
  /** Weekday label, e.g. "Poniedziałek". */
  label: string;
  /** Hours range "9:00–18:00" or the closed label. */
  value: string;
  isToday: boolean;
};

export type BusinessHoursListProps = {
  title: string;
  rows: BusinessHoursRow[];
};

/** Opening-hours table. Today's row is emphasized; the screen pre-builds rows. */
export function BusinessHoursList({ title, rows }: BusinessHoursListProps) {
  const { app } = useAppTheme();

  if (rows.length === 0) return null;

  return (
    <View style={{ gap: app.spacing.sm }}>
      <GText variant="titleSmall">{title}</GText>
      <View>
        {rows.map((row) => (
          <View key={row.id} style={[styles.row, { paddingVertical: app.spacing.xs }]}>
            <GText
              variant={row.isToday ? 'bodyStrong' : 'body'}
              color={row.isToday ? 'default' : 'muted'}
            >
              {row.label}
            </GText>
            <GText
              variant={row.isToday ? 'bodyStrong' : 'body'}
              color={row.isToday ? 'default' : 'muted'}
            >
              {row.value}
            </GText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
