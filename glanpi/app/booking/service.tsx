import { LegendList } from '@legendapp/list/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { BookingServiceLite } from '@/api';
import { BookingModalHeader, ServiceOptionRow } from '@/components/booking';
import {
  GBottomBar,
  GButton,
  GDivider,
  GEmptyState,
  GScreen,
  GSpinner,
  GText,
} from '@/components/ui';
import { useSalon } from '@/hooks/use-salon';
import { useSalonServices } from '@/hooks/use-salon-services';
import { usePostBooking } from '@/hooks/use-post-booking';
import { track } from '@/lib/analytics';
import { formatDuration, formatPrice } from '@/lib/format';
import { useBookingDraft } from '@/providers/booking-draft-provider';
import { useAppTheme } from '@/theme';

/**
 * Booking · Step 1 — Service selection (design §5.1). Lands preselected when
 * entered from a post/service row, fully editable. Prices come from
 * `/salons/services/` (the `salon_booking` payload lacks them — G3).
 */
export default function BookingServiceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { app } = useAppTheme();
  const { set } = useBookingDraft();
  const params = useLocalSearchParams<{ salonId: string; postId?: string; serviceId?: string }>();

  const { data: services, isLoading } = useSalonServices(Number(params.salonId));
  const { data: postBooking } = usePostBooking(params.postId ?? '');
  const { data: salon } = useSalon(params.salonId);

  const options = useMemo<BookingServiceLite[]>(
    () =>
      (services ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        duration_minutes: s.duration_minutes,
        price_display: s.price_display,
      })),
    [services],
  );

  const [selectedId, setSelectedId] = useState<string | undefined>(params.serviceId);

  // Default to the preselected service once options resolve.
  useEffect(() => {
    if (!selectedId && params.serviceId) setSelectedId(params.serviceId);
  }, [params.serviceId, selectedId]);

  useEffect(() => {
    track('booking_start', {
      entry: params.postId ? 'post' : 'salon',
      preselected: !!params.serviceId,
    });
  }, [params.postId, params.serviceId]);

  // Seed salon-level draft fields (used by later steps + the booking call).
  useEffect(() => {
    const salonId = postBooking?.salon.id ?? salon?.id ?? params.salonId;
    set({
      salonId,
      postId: params.postId,
      salonName: postBooking?.salon.name ?? salon?.name,
      salonAddress: postBooking?.salon.address ?? salon?.address,
      timezone: postBooking?.salon.timezone ?? salon?.timezone,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postBooking?.salon.id, salon?.id]);

  const selected = options.find((o) => String(o.id) === String(selectedId));

  const onNext = () => {
    if (!selected) return;
    set({ service: selected });
    track('service_select', { service_id: selected.id });
    router.push('/booking/schedule');
  };

  const summary = selected
    ? `${selected.name} · ${formatDuration(selected.duration_minutes)}`
    : undefined;

  return (
    <GScreen edges={[]} padded={false} tone="background">
      <BookingModalHeader
        title={t('booking.step.service')}
        step={0}
        onClose={() => router.dismissAll()}
      />

      {isLoading ? (
        <GSpinner centered />
      ) : options.length === 0 ? (
        <GEmptyState icon="tag-outline" title={t('salon.noServices')} />
      ) : (
        <LegendList
          data={options}
          keyExtractor={(item) => String(item.id)}
          extraData={selectedId}
          estimatedItemSize={72}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: app.spacing.sm, paddingRight: app.spacing.lg }}
          ItemSeparatorComponent={() => (
            <View style={{ paddingLeft: app.spacing.lg }}>
              <GDivider />
            </View>
          )}
          renderItem={({ item }) => (
            <ServiceOptionRow
              name={item.name}
              duration={formatDuration(item.duration_minutes)}
              price={formatPrice(item.price_display)}
              selected={String(item.id) === String(selectedId)}
              fromPost={!!params.serviceId && String(item.id) === String(params.serviceId)}
              fromPostLabel={t('booking.fromPost')}
              onPress={() => setSelectedId(String(item.id))}
              testID={`service-row-${item.id}`}
            />
          )}
        />
      )}

      <GBottomBar
        summary={
          summary ? (
            <GText variant="caption" color="muted" numberOfLines={1}>
              {summary}
            </GText>
          ) : undefined
        }
      >
        <GButton
          label={t('booking.next')}
          onPress={onNext}
          disabled={!selected}
          fullWidth={!summary}
          testID="booking-service-next"
        />
      </GBottomBar>
    </GScreen>
  );
}
