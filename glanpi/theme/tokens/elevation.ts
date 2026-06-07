import { Platform, type ViewStyle } from 'react-native';

/**
 * Cross-platform shadow presets. iOS uses shadow* props, Android uses
 * `elevation`. Apply via `elevation.card` etc. on a Surface/View.
 */
type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

const make = (height: number, opacity: number, radius: number, android: number): ShadowStyle =>
  Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#1C1B1A',
      shadowOffset: { width: 0, height },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    default: { elevation: android },
  }) as ShadowStyle;

export const elevation = {
  none: make(0, 0, 0, 0),
  card: make(2, 0.08, 8, 2),
  raised: make(4, 0.12, 16, 6),
} as const;

export type Elevation = typeof elevation;
