/**
 * Raw brand palette + semantic color maps.
 *
 * This is the single source of truth for color. Re-skinning the app = editing
 * `palette` / `lightColors` here. Components never reference hex values directly;
 * they read semantic keys via `useAppTheme()`.
 */

/** Raw, brand-named colors. Do not consume these directly in components. */
export const palette = {
  beige: '#F4EEE7',
  beigeStrong: '#EBE3D8',
  taupe: '#9C8577',
  taupeDark: '#897264',
  brown: '#8A6E52',
  white: '#FFFFFF',
  border: '#E4DDD3',
  ink: '#1C1B1A',
  inkMuted: '#6E665E',
  inkFaint: '#A39A8F',
  star: '#D9A406',
  danger: '#B3261E',
  success: '#3F7D4E',
} as const;

/**
 * Semantic color map — keyed by intent, not by Material role names.
 * `lightColors` and `darkColors` MUST share the exact same keys so the theme
 * can switch without any component refactor.
 */
export const lightColors = {
  background: palette.beige,
  backgroundStrong: palette.beigeStrong,
  surface: palette.white,
  primary: palette.taupe,
  primaryPressed: palette.taupeDark,
  onPrimary: palette.white,
  accent: palette.brown,
  onAccent: palette.white,
  outline: palette.border,
  text: palette.ink,
  textMuted: palette.inkMuted,
  textFaint: palette.inkFaint,
  star: palette.star,
  danger: palette.danger,
  success: palette.success,
} as const;

export type AppColors = typeof lightColors;

/**
 * Dark theme placeholder — same shape as `lightColors`, filled in a later phase.
 * Currently mirrors light so the app is dark-ready structurally without yet
 * shipping a real dark palette.
 */
export const darkColors: AppColors = {
  ...lightColors,
};
