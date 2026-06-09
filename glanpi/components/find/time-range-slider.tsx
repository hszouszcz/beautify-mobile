import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

// --- Time domain: 06:00 → 22:00 in 30-min steps (33 stops, indices 0…32). ---
export const TIME_START_HOUR = 6;
export const TIME_END_HOUR = 22;
const STEP_MIN = 30;
export const TIME_STEPS = ((TIME_END_HOUR - TIME_START_HOUR) * 60) / STEP_MIN;

export function indexToTime(index: number): string {
  const total = TIME_START_HOUR * 60 + index * STEP_MIN;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToIndex(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return Math.round((h * 60 + m - TIME_START_HOUR * 60) / STEP_MIN);
}

const TOUCH = 44; // gesture/touch target
const HANDLE = 28; // visible circle
const TRACK_H = 6;
/** Boundary ticks (fractions of the domain): 06:00 / 12:00 / 17:00 / 22:00. */
const MARKS = [0, 12 / TIME_STEPS, 22 / TIME_STEPS, 1];
const ZONES: { from: number; to: number; key: 'morning' | 'afternoon' | 'evening' }[] = [
  { from: 0, to: 12 / TIME_STEPS, key: 'morning' },
  { from: 12 / TIME_STEPS, to: 22 / TIME_STEPS, key: 'afternoon' },
  { from: 22 / TIME_STEPS, to: 1, key: 'evening' },
];

export type TimeRangeSliderProps = {
  fromIndex: number;
  toIndex: number;
  /** Inactive = no window set; the fill/handles render muted until first touch. */
  active: boolean;
  onChange: (fromIndex: number, toIndex: number) => void;
  /** Localized daypart captions, keyed morning/afternoon/evening. */
  zoneLabel: (key: 'morning' | 'afternoon' | 'evening') => string;
};

/**
 * Dual-handle time-range slider on a daypart-labeled track. Handles snap to
 * 30-min steps and keep a one-step gap so the range can't invert. Gesture +
 * position math run on the UI thread (Reanimated worklets); `onChange` is
 * marshalled back to JS only when the snapped step actually changes. Inline (no
 * Portal), so it stays interactive inside the filter modal.
 */
export function TimeRangeSlider({
  fromIndex,
  toIndex,
  active,
  onChange,
  zoneLabel,
}: TimeRangeSliderProps) {
  const { app } = useAppTheme();
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  const fromX = useSharedValue(0);
  const toX = useSharedValue(0);
  const stepW = useSharedValue(0);
  const startFrom = useSharedValue(0);
  const startTo = useSharedValue(0);
  const lastFrom = useSharedValue(fromIndex);
  const lastTo = useSharedValue(toIndex);

  // Sync handle positions from props whenever they (or the width) change — but
  // not mid-drag, where the gesture owns the positions.
  useEffect(() => {
    if (width <= 0 || dragging) return;
    const step = width / TIME_STEPS;
    stepW.value = step;
    lastFrom.value = fromIndex;
    lastTo.value = toIndex;
    fromX.value = withTiming(fromIndex * step, { duration: 140 });
    toX.value = withTiming(toIndex * step, { duration: 140 });
  }, [width, dragging, fromIndex, toIndex, fromX, toX, stepW, lastFrom, lastTo]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const fromPan = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startFrom.value = fromX.value;
      runOnJS(setDragging)(true);
    })
    .onUpdate((e) => {
      'worklet';
      const x = Math.min(Math.max(startFrom.value + e.translationX, 0), toX.value - stepW.value);
      fromX.value = x;
      const idx = Math.round(x / stepW.value);
      if (idx !== lastFrom.value) {
        lastFrom.value = idx;
        runOnJS(onChange)(idx, lastTo.value);
      }
    })
    .onEnd(() => {
      'worklet';
      fromX.value = withTiming(lastFrom.value * stepW.value, { duration: 120 });
      runOnJS(setDragging)(false);
    });

  const toPan = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startTo.value = toX.value;
      runOnJS(setDragging)(true);
    })
    .onUpdate((e) => {
      'worklet';
      const x = Math.min(Math.max(startTo.value + e.translationX, fromX.value + stepW.value), width);
      toX.value = x;
      const idx = Math.round(x / stepW.value);
      if (idx !== lastTo.value) {
        lastTo.value = idx;
        runOnJS(onChange)(lastFrom.value, idx);
      }
    })
    .onEnd(() => {
      'worklet';
      toX.value = withTiming(lastTo.value * stepW.value, { duration: 120 });
      runOnJS(setDragging)(false);
    });

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: fromX.value }],
    width: Math.max(toX.value - fromX.value, 0),
  }));
  const fromStyle = useAnimatedStyle(() => ({ transform: [{ translateX: fromX.value - TOUCH / 2 }] }));
  const toStyle = useAnimatedStyle(() => ({ transform: [{ translateX: toX.value - TOUCH / 2 }] }));

  // Screen-reader stepping (the touch path is the gesture above).
  const nudgeFrom = (delta: number) =>
    onChange(Math.min(Math.max(fromIndex + delta, 0), toIndex - 1), toIndex);
  const nudgeTo = (delta: number) =>
    onChange(fromIndex, Math.min(Math.max(toIndex + delta, fromIndex + 1), TIME_STEPS));

  const handleBorder = active ? app.colors.accent : app.colors.primary;

  return (
    <View style={{ gap: app.spacing.xs }}>
      {/* Daypart captions over the track */}
      <View style={[styles.overlayRow, { height: 18, marginHorizontal: TOUCH / 2 }]}>
        {width > 0 &&
          ZONES.map((z) => (
            <GText
              key={z.key}
              variant="caption"
              color="muted"
              align="center"
              style={[styles.absolute, { left: z.from * width, width: (z.to - z.from) * width }]}
            >
              {zoneLabel(z.key)}
            </GText>
          ))}
      </View>

      <View style={[styles.trackArea, { marginHorizontal: TOUCH / 2 }]} onLayout={onLayout}>
        <View
          style={[
            styles.track,
            { backgroundColor: app.colors.backgroundStrong, borderRadius: TRACK_H / 2 },
          ]}
        />
        {width > 0 && (
          <Animated.View
            style={[
              styles.fill,
              fillStyle,
              {
                backgroundColor: app.colors.accent,
                borderRadius: TRACK_H / 2,
                opacity: active ? 1 : 0, // hidden until a window is set
              },
            ]}
          />
        )}

        {width > 0 && (
          <>
            <GestureDetector gesture={fromPan}>
              <Animated.View
                accessibilityRole="adjustable"
                accessibilityLabel={indexToTime(fromIndex)}
                accessibilityValue={{ text: indexToTime(fromIndex) }}
                accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                onAccessibilityAction={(e) =>
                  nudgeFrom(e.nativeEvent.actionName === 'increment' ? 1 : -1)
                }
                style={[styles.touch, fromStyle]}
              >
                <View
                  style={[
                    styles.handle,
                    app.elevation.raised,
                    { backgroundColor: app.colors.surface, borderColor: handleBorder },
                  ]}
                />
              </Animated.View>
            </GestureDetector>

            <GestureDetector gesture={toPan}>
              <Animated.View
                accessibilityRole="adjustable"
                accessibilityLabel={indexToTime(toIndex)}
                accessibilityValue={{ text: indexToTime(toIndex) }}
                accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                onAccessibilityAction={(e) =>
                  nudgeTo(e.nativeEvent.actionName === 'increment' ? 1 : -1)
                }
                style={[styles.touch, toStyle]}
              >
                <View
                  style={[
                    styles.handle,
                    app.elevation.raised,
                    { backgroundColor: app.colors.surface, borderColor: handleBorder },
                  ]}
                />
              </Animated.View>
            </GestureDetector>
          </>
        )}
      </View>

      {/* Boundary ticks */}
      <View style={[styles.overlayRow, { height: 16, marginHorizontal: TOUCH / 2 }]}>
        {width > 0 &&
          MARKS.map((frac) => (
            <GText
              key={frac}
              variant="caption"
              color="faint"
              style={[
                styles.absolute,
                styles.tickLabel,
                {
                  left: frac * width - 16,
                  textAlign: frac === 0 ? 'left' : frac === 1 ? 'right' : 'center',
                },
              ]}
            >
              {indexToTime(Math.round(frac * TIME_STEPS))}
            </GText>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRow: { justifyContent: 'center' },
  absolute: { position: 'absolute' },
  trackArea: { height: TOUCH, justifyContent: 'center' },
  track: { height: TRACK_H, width: '100%' },
  fill: { position: 'absolute', height: TRACK_H, left: 0 },
  touch: {
    position: 'absolute',
    width: TOUCH,
    height: TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: HANDLE,
    height: HANDLE,
    borderRadius: HANDLE / 2,
    borderWidth: 2,
  },
  tickLabel: { width: 32 },
});
