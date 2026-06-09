import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { GChip } from '@/components/ui';
import { spacing } from '@/theme';
import type { PostType } from '@/api';

type CategoryOption = { value?: PostType; labelKey: string };

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: undefined, labelKey: 'explore.category.all' },
  { value: 'hair', labelKey: 'explore.category.hair' },
  { value: 'makeup', labelKey: 'explore.category.makeup' },
  { value: 'nails', labelKey: 'explore.category.nails' },
  { value: 'skin', labelKey: 'explore.category.skin' },
];

/**
 * Shared horizontal-scroll state so multiple `ExploreCategoryFilters` instances
 * (expanded header + compact scroll overlay) stay aligned. `offset` is the
 * current x-offset; `owner` marks which instance is actively being dragged so
 * the passive instance follows without a feedback loop. Create once per screen
 * via `useChipScrollSync` and pass to every instance.
 */
export type ChipScrollSync = {
  offset: SharedValue<number>;
  owner: SharedValue<number>;
};

export function useChipScrollSync(): ChipScrollSync {
  const offset = useSharedValue(0);
  const owner = useSharedValue(0);
  return { offset, owner };
}

// Module-level counter → each mounted instance gets a stable, non-zero id.
// Zero is reserved for "no owner yet" so neither instance drives on first paint.
let nextInstanceId = 1;

export type ExploreCategoryFiltersProps = {
  postType?: PostType;
  onChangePostType: (postType?: PostType) => void;
  /**
   * When provided, keeps this instance's horizontal scroll position in sync with
   * every other instance sharing the same object. Used so the chip row reads the
   * same in the expanded header and the compact scroll overlay.
   */
  sync?: ChipScrollSync;
};

/**
 * Horizontal chip row for explore feed filtering. Self-contained: owns the
 * category list and translations. Used in both the expanded `ExploreHeader` and
 * the compact scroll overlay so filters are always reachable. Pass a shared
 * `sync` to keep the two instances' scroll offset consistent.
 */
export function ExploreCategoryFilters({
  postType,
  onChangePostType,
  sync,
}: ExploreCategoryFiltersProps) {
  const { t } = useTranslation();
  const aref = useAnimatedRef<Animated.ScrollView>();
  const instanceId = useRef(nextInstanceId++).current;

  const categories = useMemo(
    () => CATEGORY_OPTIONS.map((opt) => ({ ...opt, label: t(opt.labelKey) })),
    [t],
  );

  // This instance writes the shared offset only while it is the active dragger;
  // the other instance(s) mirror that offset via the reaction below.
  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      if (sync) sync.owner.value = instanceId;
    },
    onScroll: (event) => {
      if (sync && sync.owner.value === instanceId) {
        sync.offset.value = event.contentOffset.x;
      }
    },
  });

  // Follow the shared offset when another instance is driving. Guarding on the
  // owner prevents the active instance from fighting its own gesture.
  useAnimatedReaction(
    () => sync?.offset.value ?? 0,
    (x) => {
      if (sync && sync.owner.value !== instanceId) {
        scrollTo(aref, x, 0, false);
      }
    },
  );

  return (
    <Animated.ScrollView
      ref={aref}
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={styles.content}
    >
      {categories.map((opt) => (
        <GChip
          key={opt.labelKey}
          label={opt.label}
          selected={opt.value === postType}
          onPress={() => onChangePostType(opt.value)}
        />
      ))}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
});
