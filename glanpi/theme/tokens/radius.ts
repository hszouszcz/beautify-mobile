/**
 * Corner-radius scale. `pill` is used for fully-rounded elements
 * (search bar, segmented toggle, chips).
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export type Radius = typeof radius;
