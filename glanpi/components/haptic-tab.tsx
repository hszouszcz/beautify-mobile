import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAppTheme } from '@/theme';

export function HapticTab({ children, ...props }: BottomTabBarButtonProps) {
  const { app } = useAppTheme();
  const isSelected = props.accessibilityState?.selected ?? false;
  const progress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected, progress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
    opacity: progress.value,
  }));

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    >
      <View style={styles.wrapper}>
        <Animated.View
          style={[styles.indicator, { backgroundColor: app.colors.accent }, indicatorStyle]}
        />
        {children}
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});
