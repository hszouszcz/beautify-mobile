import { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

type UseCollapsingHeaderOptions = {
  /** Scroll distance (px) at which the compact bar reaches full opacity. Default: 80. */
  collapseThreshold?: number;
};

/**
 * Drives the scroll-collapsing header pattern for list screens.
 *
 * Wire up:
 *   `scrollOffset`    → AnimatedLegendList `sharedValues={{ scrollOffset }}`
 *   `compactBarStyle` → the Animated.View wrapping the compact overlay bar
 *
 * The return type for `compactBarStyle` is intentionally inferred (not
 * annotated) so TypeScript resolves the exact animated style shape rather
 * than the generic `DefaultStyle` bound, which is incompatible with
 * `Animated.View`'s style prop in Reanimated 4.x.
 */
export function useCollapsingHeader({ collapseThreshold = 80 }: UseCollapsingHeaderOptions = {}) {
  const scrollOffset: SharedValue<number> = useSharedValue(0);

  const compactBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [collapseThreshold * 0.625, collapseThreshold],
      [0, 1],
      'clamp',
    );
    return {
      opacity,
      // Scale is driven directly from opacity so the two are always in sync.
      // 0.96 → 1.0 gives a gentle "grow into place" entrance without the
      // background-edge artefact of a larger scale range.
      transform: [{ scale: 0.96 + opacity * 0.04 }],
    };
  });

  return { scrollOffset, compactBarStyle };
}
