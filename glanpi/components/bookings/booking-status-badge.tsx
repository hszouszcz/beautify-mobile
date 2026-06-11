import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { BookingStatus } from '@/api';
import { GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type BookingStatusBadgeProps = {
  status: BookingStatus;
};

/**
 * Pill badge color-coded by booking status — confirmed→success, pending→primary,
 * completed→muted, cancelled→danger. Label comes from i18n (`bookings.status.*`).
 */
export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const { t } = useTranslation();
  const { app } = useAppTheme();

  const backgroundByStatus: Record<BookingStatus, string> = {
    confirmed: app.colors.success,
    pending: app.colors.primary,
    completed: app.colors.textMuted,
    cancelled: app.colors.danger,
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: backgroundByStatus[status],
          borderRadius: app.radius.pill,
          paddingHorizontal: app.spacing.md,
          paddingVertical: app.spacing.xs,
        },
      ]}
    >
      <GText variant="caption" color="onPrimary">
        {t(`bookings.status.${status}`)}
      </GText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start' },
});
