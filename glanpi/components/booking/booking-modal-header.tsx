import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GIconButton, GStepProgress, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type BookingModalHeaderProps = {
  title: string;
  /** Current segment index (0=Service, 1=Schedule, 2=Finalize). */
  step: number;
  /** Close (✕) abandons the whole flow. Omit to hide (e.g. confirmation). */
  onClose?: () => void;
};

/** Booking-flow chrome: ✕ + step title + 3-segment progress (design §5.0). */
export function BookingModalHeader({ title, step, onClose }: BookingModalHeaderProps) {
  const { app } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + app.spacing.xs,
          paddingHorizontal: app.spacing.lg,
          paddingBottom: app.spacing.md,
          gap: app.spacing.md,
          backgroundColor: app.colors.background,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <View style={styles.side}>
          {onClose && (
            <GIconButton icon="close" size={22} onPress={onClose} accessibilityLabel="Zamknij" />
          )}
        </View>
        <GText variant="titleSmall" numberOfLines={1} style={styles.title}>
          {title}
        </GText>
        <View style={styles.side} />
      </View>
      <GStepProgress steps={3} current={step} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  side: { width: 44, alignItems: 'flex-start' },
  title: { flex: 1, textAlign: 'center' },
});
