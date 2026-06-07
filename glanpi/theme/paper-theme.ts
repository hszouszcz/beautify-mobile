import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { darkColors, lightColors, type AppColors } from './tokens/colors';
import { elevation } from './tokens/elevation';
import { radius } from './tokens/radius';
import { spacing } from './tokens/spacing';
import { fontConfig } from './tokens/typography';

/**
 * Extra Glanpi tokens attached to the Paper theme under the `app` key. Anything
 * in here is reachable from components via `useAppTheme().app.*`. This is what
 * keeps the design system swappable: components read tokens, never raw Paper.
 */
type AppTokens = {
  colors: AppColors;
  spacing: typeof spacing;
  radius: typeof radius;
  elevation: typeof elevation;
};

const buildAppTokens = (colors: AppColors): AppTokens => ({
  colors,
  spacing,
  radius,
  elevation,
});

/** Map our semantic colors onto the MD3 color roles Paper components consume. */
const toMd3Colors = (base: typeof MD3LightTheme.colors, c: AppColors) => ({
  ...base,
  primary: c.primary,
  onPrimary: c.onPrimary,
  primaryContainer: c.backgroundStrong,
  onPrimaryContainer: c.text,
  secondary: c.accent,
  onSecondary: c.onAccent,
  background: c.background,
  onBackground: c.text,
  surface: c.surface,
  onSurface: c.text,
  surfaceVariant: c.backgroundStrong,
  onSurfaceVariant: c.textMuted,
  outline: c.outline,
  outlineVariant: c.outline,
  error: c.danger,
  elevation: {
    ...base.elevation,
    level0: 'transparent',
    level1: c.surface,
    level2: c.surface,
    level3: c.surface,
  },
});

export const glanpiLightTheme = {
  ...MD3LightTheme,
  fonts: fontConfig,
  roundness: radius.md,
  colors: toMd3Colors(MD3LightTheme.colors, lightColors),
  app: buildAppTokens(lightColors),
};

/** Dark stub — same structure; uses `darkColors` (currently mirrors light). */
export const glanpiDarkTheme = {
  ...MD3DarkTheme,
  fonts: fontConfig,
  roundness: radius.md,
  colors: toMd3Colors(MD3DarkTheme.colors, darkColors),
  app: buildAppTokens(darkColors),
};
