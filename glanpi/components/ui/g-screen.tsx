import { StyleSheet, View, type ViewProps } from 'react-native';
import { type Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme';

export type GScreenProps = ViewProps & {
  /** Which edges to pad for the safe area. Default: top + bottom. */
  edges?: Edge[];
  /** Apply horizontal screen padding (spacing.lg). Default: true. */
  padded?: boolean;
  /** Background tone. `strong` = the beige-strong surface. Default: background. */
  tone?: 'background' | 'strong' | 'surface';
};

/**
 * Themed safe-area screen container. Supersedes screen-level use of
 * `ThemedView`. Wrap every route's root in this.
 */
export function GScreen({
  edges = ['top', 'bottom'],
  padded = true,
  tone = 'background',
  style,
  children,
  ...rest
}: GScreenProps) {
  const insets = useSafeAreaInsets();
  const { app } = useAppTheme();

  const background = {
    background: app.colors.background,
    strong: app.colors.backgroundStrong,
    surface: app.colors.surface,
  }[tone];

  const safeArea = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: background },
        safeArea,
        padded && { paddingHorizontal: app.spacing.lg },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
