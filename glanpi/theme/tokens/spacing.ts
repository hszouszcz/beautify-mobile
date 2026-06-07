/**
 * 4-based spacing scale. Use these tokens for padding, margin and gaps so
 * rhythm stays consistent across the app.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export type Spacing = typeof spacing;
