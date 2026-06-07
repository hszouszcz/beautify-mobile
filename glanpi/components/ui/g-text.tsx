import { StyleSheet, type TextStyle } from 'react-native';
import { Text, type TextProps } from 'react-native-paper';

import { useAppTheme } from '@/theme';

/** Glanpi text variants → Paper MD3 variants. Serif is applied to display. */
const VARIANT_MAP = {
  display: 'displayMedium',
  displaySmall: 'displaySmall',
  title: 'titleLarge',
  titleSmall: 'titleMedium',
  body: 'bodyMedium',
  bodyStrong: 'bodyLarge',
  label: 'labelLarge',
  caption: 'bodySmall',
} as const;

export type GTextVariant = keyof typeof VARIANT_MAP;
export type GTextColor = 'default' | 'muted' | 'faint' | 'primary' | 'onPrimary' | 'danger';

export type GTextProps = Omit<TextProps<never>, 'variant' | 'theme'> & {
  variant?: GTextVariant;
  color?: GTextColor;
  italic?: boolean;
  align?: TextStyle['textAlign'];
};

/**
 * Branded text primitive. Always use this instead of RN `Text` / Paper `Text`
 * so typography + color stay token-driven. Supersedes `ThemedText`.
 */
export function GText({
  variant = 'body',
  color = 'default',
  italic = false,
  align,
  style,
  ...rest
}: GTextProps) {
  const { app } = useAppTheme();

  const colorValue: Record<GTextColor, string> = {
    default: app.colors.text,
    muted: app.colors.textMuted,
    faint: app.colors.textFaint,
    primary: app.colors.primary,
    onPrimary: app.colors.onPrimary,
    danger: app.colors.danger,
  };

  return (
    <Text
      variant={VARIANT_MAP[variant]}
      style={[
        { color: colorValue[color], textAlign: align },
        italic && styles.italic,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  italic: { fontStyle: 'italic' },
});
