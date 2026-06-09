import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { GText } from '@/components/ui';
import { elevation, useAppTheme } from '@/theme';

import type { FindView } from './find-header';

export type FindViewToggleProps = {
  view: FindView;
  onChange: (view: FindView) => void;
  /** Distance from the bottom of the content area (clears the tab bar). */
  bottomInset: number;
};

/**
 * Floating List ↔ Map switch (Airbnb-style). Sits over the results and always
 * shows the view you'll switch *to* — a map pill while browsing the list, a list
 * pill while on the map — so a single tap flips between them.
 */
export function FindViewToggle({ view, onChange, bottomInset }: FindViewToggleProps) {
  const { t } = useTranslation();
  const { app } = useAppTheme();

  const toMap = view === 'list';
  const icon = toMap ? 'map-outline' : 'view-list';
  const label = toMap ? t('find.tab.map') : t('find.tab.list');

  return (
    <Pressable
      onPress={() => onChange(toMap ? 'map' : 'list')}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.pill,
        elevation.raised,
        {
          bottom: bottomInset,
          backgroundColor: app.colors.accent,
          borderRadius: app.radius.pill,
          paddingHorizontal: app.spacing.lg,
          gap: app.spacing.xs,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon as never} size={20} color={app.colors.onAccent} />
      <GText variant="label" style={{ color: app.colors.onAccent }}>
        {label}
      </GText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
});
