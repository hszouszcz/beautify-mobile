import { type StyleProp, type ViewStyle } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { useAppTheme } from '@/theme';

export type GPressableProps = {
  onPress?: () => void;
  /** Clip the ripple to the rounded bounds. Default: true. */
  borderless?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Forwarded to the touchable for E2E + integration-test selectors. */
  testID?: string;
  accessibilityLabel?: string;
  children: React.ReactNode;
};

/**
 * Branded pressable surface with a themed ripple. Use this (not Paper's
 * `TouchableRipple`) anywhere a custom tappable area is needed — keeps the
 * Paper dependency inside the kit.
 */
export function GPressable({
  onPress,
  borderless = true,
  disabled,
  style,
  testID,
  accessibilityLabel,
  children,
}: GPressableProps) {
  const { app } = useAppTheme();

  return (
    <TouchableRipple
      onPress={onPress}
      borderless={borderless}
      disabled={disabled}
      // rippleColor={app.colors.backgroundStrong}
      rippleColor="rgba(235, 227, 216, 0.3)"
      // underlayColor={app.colors.accent}
      style={style}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      <>{children}</>
    </TouchableRipple>
  );
}
