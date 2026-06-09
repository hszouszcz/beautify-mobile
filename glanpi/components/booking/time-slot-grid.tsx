import { LegendList } from '@legendapp/list/react-native';
import { StyleSheet, View } from 'react-native';

import type { SlotOption } from '@/api';
import { GButton, GText } from '@/components/ui';
import { formatSlotTime } from '@/lib/datetime';
import { useAppTheme } from '@/theme';

import { TimeSlotPill } from './time-slot-pill';

export type TimeSlotGridState = 'loading' | 'error' | 'empty' | 'ready';

export type TimeSlotGridLabels = {
  empty: string;
  emptyHint: string;
  error: string;
  retry: string;
};

export type TimeSlotGridProps = {
  options: SlotOption[];
  state: TimeSlotGridState;
  /** Selected option key = its `start_datetime`. */
  selectedKey: string | undefined;
  onSelect: (option: SlotOption) => void;
  labels: TimeSlotGridLabels;
  onRetry: () => void;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
};

/**
 * The slot area of booking Schedule: a 3-column LegendList of slot pills with
 * the staff selector + date strip in the header slot. Owns the loading / empty /
 * error region states so the date strip in the header stays interactive while
 * slots reload (design §5.2).
 */
export function TimeSlotGrid({
  options,
  state,
  selectedKey,
  onSelect,
  labels,
  onRetry,
  ListHeaderComponent,
}: TimeSlotGridProps) {
  const { app } = useAppTheme();

  const data = state === 'ready' ? options : [];

  return (
    <LegendList
      data={data}
      keyExtractor={(item) => item.start_datetime}
      // `selected` depends on `selectedKey` (outside `item`); without extraData
      // LegendList memoizes the pills and the highlight won't move on tap.
      extraData={selectedKey}
      numColumns={3}
      estimatedItemSize={44}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={{
        paddingHorizontal: app.spacing.lg,
        paddingBottom: app.spacing.xxl,
        gap: app.spacing.sm,
      }}
      columnWrapperStyle={{ gap: app.spacing.sm }}
      ListEmptyComponent={
        <View style={[styles.region, { paddingVertical: app.spacing.xl }]}>
          {state === 'loading' && <SlotSkeleton />}
          {state === 'empty' && (
            <View style={styles.message}>
              <GText variant="body" color="muted" align="center">
                {labels.empty}
              </GText>
              <GText variant="caption" color="faint" align="center">
                {labels.emptyHint}
              </GText>
            </View>
          )}
          {state === 'error' && (
            <View style={styles.message}>
              <GText variant="body" color="muted" align="center">
                {labels.error}
              </GText>
              <GButton kind="text" label={labels.retry} onPress={onRetry} />
            </View>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <TimeSlotPill
          time={formatSlotTime(item.display.start_time)}
          selected={item.start_datetime === selectedKey}
          onPress={() => onSelect(item)}
        />
      )}
    />
  );
}

/** Two rows of muted placeholder pills while availability loads. */
function SlotSkeleton() {
  const { app } = useAppTheme();
  return (
    <View style={styles.skeleton}>
      {Array.from({ length: 6 }, (_, i) => (
        <View
          key={i}
          style={[
            styles.skeletonPill,
            { backgroundColor: app.colors.backgroundStrong, borderRadius: app.radius.pill },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  region: { alignItems: 'center' },
  message: { alignItems: 'center', gap: 8 },
  skeleton: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  skeletonPill: { width: '30%', height: 44 },
});
