import { Image } from 'expo-image';
import { useState } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GIconButton } from '@/components/ui';
import { useAppTheme } from '@/theme';

const HERO_HEIGHT = 300;

export type SalonHeroProps = {
  images: string[];
  onBack: () => void;
  onShare?: () => void;
};

/**
 * Full-bleed horizontal image pager for the salon work gallery, with floating
 * back/share controls over a scrim. Falls back to a single tinted block when no
 * images are available (the per-salon media gap — design §9 G1).
 */
export function SalonHero({ images, onBack, onShare }: SalonHeroProps) {
  const { app } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={[styles.root, { height: HERO_HEIGHT, backgroundColor: app.colors.backgroundStrong }]}>
      {images.length > 0 ? (
        <LegendList
          data={images}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={width}
          onMomentumScrollEnd={onMomentumEnd}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={{ width, height: HERO_HEIGHT }}
              contentFit="cover"
              transition={150}
            />
          )}
        />
      ) : null}

      {images.length > 1 && (
        <View style={[styles.dots, { bottom: app.spacing.md }]} pointerEvents="none">
          {images.map((uri, i) => (
            <View
              key={`${uri}-dot-${i}`}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === index ? app.colors.onAccent : 'rgba(255,255,255,0.5)',
                },
              ]}
            />
          ))}
        </View>
      )}

      <View style={[styles.controls, { top: insets.top + app.spacing.xs }]} pointerEvents="box-none">
        <FloatingButton icon="chevron-left" onPress={onBack} label="Wróć" />
        {onShare ? (
          <FloatingButton icon="share-variant" onPress={onShare} label="Udostępnij" />
        ) : (
          <View />
        )}
      </View>
    </View>
  );
}

function FloatingButton({
  icon,
  onPress,
  label,
}: {
  icon: string;
  onPress: () => void;
  label: string;
}) {
  return (
    <View style={styles.scrimCircle}>
      <GIconButton
        icon={icon}
        size={22}
        iconColor="#FFFFFF"
        onPress={onPress}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', overflow: 'hidden' },
  controls: {
    position: 'absolute',
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scrimCircle: {
    backgroundColor: 'rgba(28,27,26,0.35)',
    borderRadius: 999,
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
