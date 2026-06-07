import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

export type ImageCollageProps = {
  /** Image URIs. Up to `max` are shown in a horizontal strip. */
  uris: string[];
  max?: number;
  height?: number;
};

/**
 * Horizontal strip of work thumbnails shown at the top of a salon card.
 * Matches the 3–4 image collage in the Find mockup.
 */
export function ImageCollage({ uris, max = 4, height = 96 }: ImageCollageProps) {
  const { app } = useAppTheme();
  const shown = uris.slice(0, max);

  return (
    <View style={[styles.row, { gap: app.spacing.xs, height }]}>
      {shown.map((uri, i) => (
        <Image
          key={`${uri}-${i}`}
          source={{ uri }}
          style={[styles.thumb, { borderRadius: app.radius.sm }]}
          contentFit="cover"
          transition={150}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  thumb: { flex: 1, height: '100%' },
});
