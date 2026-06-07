import { StyleSheet, View, type ViewProps } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { useAppTheme } from '@/theme';

export type GCardProps = ViewProps & {
  onPress?: () => void;
  /** Add a hairline outline in addition to the surface. Default: false. */
  outlined?: boolean;
  /** Inner padding from the spacing scale. Default: 'md'. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

/**
 * Base elevated white card on the beige background. Pressable when `onPress` is
 * given (ripple). Composite cards (SalonCard, etc.) build on this.
 */
export function GCard({
  onPress,
  outlined = false,
  padding = 'md',
  style,
  children,
  ...rest
}: GCardProps) {
  const { app } = useAppTheme();

  const paddingValue = padding === 'none' ? 0 : app.spacing[padding];

  const cardStyle = [
    styles.card,
    app.elevation.card,
    {
      backgroundColor: app.colors.surface,
      borderRadius: app.radius.lg,
      padding: paddingValue,
      borderWidth: outlined ? StyleSheet.hairlineWidth : 0,
      borderColor: app.colors.outline,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableRipple
        onPress={onPress}
        borderless
        style={cardStyle}
        rippleColor={app.colors.backgroundStrong}
      >
        <View {...rest}>{children}</View>
      </TouchableRipple>
    );
  }

  return (
    <View style={cardStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
});
