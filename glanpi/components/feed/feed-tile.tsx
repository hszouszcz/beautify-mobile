import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { GPressable } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type FeedTileProps = {
  uri: string;
  onPress?: () => void;
  /** width / height. 1 = square (default), <1 = portrait. */
  aspectRatio?: number;
  testID?: string;
};

/**
 * A single feed image tile (Explore grid cell). Fills its column width and
 * keeps a fixed aspect ratio. Uses `expo-image` for caching/perf.
 */
export function FeedTile({ uri, onPress, aspectRatio = 1, testID }: FeedTileProps) {
  const { app } = useAppTheme();

  return (
    <GPressable
      testID={testID}
      onPress={onPress}
      style={[styles.tile, { borderRadius: app.radius.sm, aspectRatio }]}
    >
      <View style={styles.fill}>
        <Image
          source={{ uri }}
          style={styles.fill}
          contentFit="cover"
          transition={150}
        />
      </View>
    </GPressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, overflow: 'hidden' },
  fill: { flex: 1, width: '100%', height: '100%' },
});
