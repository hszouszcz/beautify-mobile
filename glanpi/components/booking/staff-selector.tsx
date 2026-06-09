import { StyleSheet, View } from 'react-native';

import { GAvatar, GPressable, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type StaffSelectorMember = {
  id: string;
  name: string;
  avatarUrl?: string;
  recommended?: boolean;
};

export type StaffSelectorProps = {
  title: string;
  recommendedLabel: string;
  members: StaffSelectorMember[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Horizontal staff selector for booking Schedule (design §5.2). Returns null
 * for single-staff salons (the control is pointless then). Default selection is
 * the recommended staff, set by the screen.
 */
export function StaffSelector({
  title,
  recommendedLabel,
  members,
  selectedId,
  onSelect,
}: StaffSelectorProps) {
  const { app } = useAppTheme();

  if (members.length <= 1) return null;

  return (
    <View style={{ gap: app.spacing.sm }}>
      <GText variant="titleSmall">{title}</GText>
      <View style={styles.row}>
        {members.map((m) => {
          const isSelected = m.id === selectedId;
          return (
            <GPressable
              key={m.id}
              onPress={() => onSelect(m.id)}
              borderless={false}
              style={styles.member}
            >
              <View
                style={[
                  styles.avatarWrap,
                  {
                    borderColor: isSelected ? app.colors.accent : 'transparent',
                    borderRadius: app.radius.pill,
                  },
                ]}
              >
                <GAvatar size={56} uri={m.avatarUrl} initials={initials(m.name)} />
              </View>
              <GText
                variant="caption"
                color={isSelected ? 'default' : 'muted'}
                numberOfLines={1}
              >
                {m.name}
              </GText>
              {m.recommended && (
                <GText variant="caption" color="primary">
                  {recommendedLabel}
                </GText>
              )}
            </GPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  member: { alignItems: 'center', gap: 4, width: 72 },
  avatarWrap: { borderWidth: 2, padding: 2 },
});
