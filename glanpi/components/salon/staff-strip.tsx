import { StyleSheet, View } from 'react-native';

import { GAvatar, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type StaffStripMember = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type StaffStripProps = {
  title: string;
  members: StaffStripMember[];
};

/** Initials from a display name, e.g. "Anna Kowalska" → "AK". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Horizontal team strip (avatars + names). Informational in MVP — everyone
 * performs every service. Hidden by the caller when there are no staff.
 */
export function StaffStrip({ title, members }: StaffStripProps) {
  const { app } = useAppTheme();

  if (members.length === 0) return null;

  return (
    <View style={{ gap: app.spacing.sm }}>
      <GText variant="titleSmall">{title}</GText>
      <View style={styles.row}>
        {members.map((m) => (
          <View key={m.id} style={styles.member}>
            <GAvatar size={56} uri={m.avatarUrl} initials={initials(m.name)} />
            <GText variant="caption" color="muted" numberOfLines={1}>
              {m.name}
            </GText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  member: { alignItems: 'center', gap: 4, width: 64 },
});
