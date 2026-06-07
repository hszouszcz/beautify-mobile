import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { configureFonts, MD3LightTheme } from 'react-native-paper';

/**
 * Font families.
 * - `serif` (Playfair Display) → display & headline variants (the "Welcome to
 *   Glanpi" brand voice).
 * - `sans` → body, label, title. `undefined` lets each platform use its system
 *   sans, which reads cleanest for UI text.
 */
export const fontFamilies = {
  serif: 'PlayfairDisplay_600SemiBold',
  serifRegular: 'PlayfairDisplay_400Regular',
  sans: undefined as string | undefined,
} as const;

/**
 * Font assets that must be loaded (via `useFonts`) before the UI renders.
 * Re-exported from `theme/index` and consumed in `app/_layout.tsx`.
 */
export const fontAssets = {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
};

const SERIF_VARIANTS: ReadonlySet<string> = new Set([
  'displayLarge',
  'displayMedium',
  'displaySmall',
  'headlineLarge',
  'headlineMedium',
  'headlineSmall',
]);

/** MD3 font config: serif on display/headline, system sans everywhere else. */
const baseFonts = MD3LightTheme.fonts as Record<string, Record<string, unknown>>;

const baseConfig = Object.fromEntries(
  Object.keys(baseFonts).map((variant) => [
    variant,
    {
      ...baseFonts[variant],
      fontFamily: SERIF_VARIANTS.has(variant) ? fontFamilies.serif : fontFamilies.sans,
    },
  ])
) as typeof MD3LightTheme.fonts;

export const fontConfig = configureFonts({ config: baseConfig });
