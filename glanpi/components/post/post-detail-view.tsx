import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GIconButton, GPressable, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type PostDetailAuthor = { name: string; avatarUrl?: string };

export type PostDetailViewProps = {
  imageUrl: string;
  categoryLabel: string;
  likesCount: number;
  title: string;
  description: string;
  moreLabel: string;
  lessLabel: string;
  author?: PostDetailAuthor;
  /** The salon strip element (screen owns enrichment + prefetch-on-press). */
  salonStrip: ReactNode;
  /** Featured-service card element, when the post has one. */
  featuredCard?: ReactNode;
  onBack: () => void;
};

/**
 * Post Detail body (design §3): full-bleed work photo with a floating back
 * button over a scrim, then a white content sheet (category + likes, title,
 * description, author, salon strip, featured-service card). The hero scales
 * subtly on pull-down (Reanimated stretchy header). The sticky CTA lives in the
 * screen's `GBottomBar`.
 */
export function PostDetailView({
  imageUrl,
  categoryLabel,
  likesCount,
  title,
  description,
  moreLabel,
  lessLabel,
  author,
  salonStrip,
  featuredCard,
  onBack,
}: PostDetailViewProps) {
  const { app } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const heroHeight = Math.round(height * 0.6);
  const [expanded, setExpanded] = useState(false);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const heroStyle = useAnimatedStyle(() => {
    const pull = scrollY.value < 0 ? -scrollY.value : 0;
    return {
      transform: [
        { translateY: scrollY.value < 0 ? scrollY.value : 0 },
        { scale: 1 + pull / heroHeight },
      ],
    };
  });

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[{ height: heroHeight }, heroStyle]}>
          <Image source={{ uri: imageUrl }} style={styles.heroImage} contentFit="cover" transition={150} />
        </Animated.View>

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: app.colors.surface,
              borderTopLeftRadius: app.radius.xl,
              borderTopRightRadius: app.radius.xl,
              marginTop: -app.spacing.lg,
              padding: app.spacing.lg,
              gap: app.spacing.md,
            },
          ]}
        >
          <View style={styles.metaRow}>
            <GText variant="label" color="primary">
              {categoryLabel}
            </GText>
            <View style={styles.likes}>
              <MaterialCommunityIcons name="heart-outline" size={16} color={app.colors.textMuted} />
              <GText variant="caption" color="muted">
                {likesCount}
              </GText>
            </View>
          </View>

          <GText variant="title">{title}</GText>

          {!!description.trim() && (
            <View style={styles.descBlock}>
              <GText variant="body" color="muted" numberOfLines={expanded ? undefined : 2}>
                {description}
              </GText>
              <GPressable onPress={() => setExpanded((v) => !v)} borderless={false}>
                <GText variant="label" color="primary">
                  {expanded ? lessLabel : moreLabel}
                </GText>
              </GPressable>
            </View>
          )}

          {author && (
            <View style={styles.authorRow}>
              <MaterialCommunityIcons name="account-circle-outline" size={28} color={app.colors.textFaint} />
              <GText variant="label" color="muted">
                {author.name}
              </GText>
            </View>
          )}

          {salonStrip}
          {featuredCard}
        </View>
      </Animated.ScrollView>

      <View style={[styles.backButton, { top: insets.top + app.spacing.xs }]}>
        <View style={styles.scrimCircle}>
          <GIconButton icon="chevron-left" size={22} iconColor="#FFFFFF" onPress={onBack} accessibilityLabel="Wróć" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  heroImage: { width: '100%', height: '100%' },
  sheet: {},
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  likes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  descBlock: { gap: 2 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { position: 'absolute', left: 4 },
  scrimCircle: { backgroundColor: 'rgba(28,27,26,0.35)', borderRadius: 999 },
});
