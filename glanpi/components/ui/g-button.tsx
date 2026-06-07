import { StyleSheet } from 'react-native';
import { Button, type ButtonProps } from 'react-native-paper';

import { useAppTheme } from '@/theme';

export type GButtonKind = 'primary' | 'secondary' | 'text';

export type GButtonProps = Omit<ButtonProps, 'mode' | 'children' | 'theme'> & {
  kind?: GButtonKind;
  label: string;
  fullWidth?: boolean;
};

const KIND_TO_MODE: Record<GButtonKind, ButtonProps['mode']> = {
  primary: 'contained',
  secondary: 'contained-tonal',
  text: 'text',
};

/**
 * Branded button. `kind="primary"` is the taupe CTA (e.g. "Use my current
 * location"); `fullWidth` stretches it. Hides Paper's `mode`.
 */
export function GButton({
  kind = 'primary',
  label,
  fullWidth = false,
  style,
  contentStyle,
  ...rest
}: GButtonProps) {
  const { app } = useAppTheme();

  return (
    <Button
      mode={KIND_TO_MODE[kind]}
      style={[fullWidth && styles.fullWidth, { borderRadius: app.radius.md }, style]}
      contentStyle={[styles.content, contentStyle]}
      {...rest}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
  content: { height: 52 },
});
