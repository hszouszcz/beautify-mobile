import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { GButton } from './g-button';
import { GText } from './g-text';

export type GEmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Centered empty / zero-data state, e.g. "Coming soon to your city". Optional
 * icon, supporting text and a single CTA.
 */
export function GEmptyState({
  icon = 'image-multiple-outline',
  title,
  description,
  actionLabel,
  onAction,
}: GEmptyStateProps) {
  const { app } = useAppTheme();

  return (
    <View style={styles.root}>
      <MaterialCommunityIcons name={icon as never} size={48} color={app.colors.textFaint} />
      <GText variant="title" align="center">
        {title}
      </GText>
      {description && (
        <GText variant="body" color="muted" align="center">
          {description}
        </GText>
      )}
      {actionLabel && onAction && (
        <GButton kind="secondary" label={actionLabel} onPress={onAction} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
});
