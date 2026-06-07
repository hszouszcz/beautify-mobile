import { StyleSheet, View, type ViewStyle } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { useAppTheme } from '@/theme';

export type GSpinnerProps = {
  size?: 'small' | 'large' | number;
  /** Fill and center within the parent (e.g. the welcome loader). */
  centered?: boolean;
  style?: ViewStyle;
};

/** Loading indicator in the brand color. `centered` fills the parent. */
export function GSpinner({ size = 'small', centered = false, style }: GSpinnerProps) {
  const { app } = useAppTheme();

  return (
    <View style={[centered && styles.centered, style]}>
      <ActivityIndicator animating size={size} color={app.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
