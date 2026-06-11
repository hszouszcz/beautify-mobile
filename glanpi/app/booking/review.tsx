import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';

import { queryKeys, type ApiError } from '@/api';
import { BookingModalHeader, BookingSummaryCard, HoldCountdownBanner } from '@/components/booking';
import { GBottomBar, GButton, GScreen, GText } from '@/components/ui';
import { useCreateBooking } from '@/hooks/use-create-booking';
import { useMe } from '@/hooks/use-me';
import { track } from '@/lib/analytics';
import { formatLongDate, formatShortDate, formatSlotTime } from '@/lib/datetime';
import { formatDuration, formatPrice } from '@/lib/format';
import { useBookingDraft } from '@/providers/booking-draft-provider';
import { useAppTheme } from '@/theme';

const CANCEL_NOTICE_HOURS = 24;

/**
 * Booking · Step 3′ — Review & confirm (design §5.5). Authenticated only: a
 * single explicit "Zarezerwuj" that creates the booking. Falls through to
 * Details if `/me` has no name so the salon always gets one.
 */
export default function BookingReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { app } = useAppTheme();
  const queryClient = useQueryClient();
  const { draft, set } = useBookingDraft();
  const { data: me } = useMe();
  const createBooking = useCreateBooking();
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);

  // No name on file → collect it (Details), so the salon always sees a name.
  useEffect(() => {
    if (me && !me.first_name) router.replace('/booking/details');
  }, [me, router]);

  const onClose = () => {
    if (draft.hold) {
      Alert.alert(t('booking.abandon.title'), t('booking.abandon.message'), [
        { text: t('booking.abandon.cancel'), style: 'cancel' },
        {
          text: t('booking.abandon.confirm'),
          style: 'destructive',
          onPress: () => router.dismissAll(),
        },
      ]);
    } else {
      router.dismissAll();
    }
  };

  const service = draft.service;
  const slotTime = draft.slot ? formatSlotTime(draft.slot.display.start_time) : '';
  const dateTimeLabel = draft.date ? `${formatShortDate(draft.date)} · ${slotTime}` : slotTime;

  const onConfirm = async () => {
    if (!draft.salonId || !service || !draft.staffId || !draft.slot) return;
    setErrorMsg(undefined);
    try {
      const res = await createBooking.mutateAsync({
        salon: draft.salonId,
        service: service.id,
        staff: draft.staffId,
        start_time: draft.slot.start_datetime,
        end_time: draft.slot.end_datetime,
      });
      set({ createdBooking: res });
      track('booking_created', { status: res.status });
      router.replace('/booking/confirmation');
    } catch (e) {
      const err = e as ApiError;
      const msg = err.message?.toLowerCase() ?? '';
      const isLimit = msg.includes('limit') || msg.includes('maksy');
      if ((err.status === 400 || err.status === 409) && !isLimit) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.bookings.availability(
            draft.salonId,
            service.id,
            draft.staffId,
            draft.date ?? '',
          ),
        });
        set({ slot: undefined });
        router.replace('/booking/schedule');
        return;
      }
      setErrorMsg(isLimit ? t('booking.error.limit') : t('booking.error.generic'));
    }
  };

  return (
    <GScreen edges={[]} padded={false} tone="background">
      <BookingModalHeader title={t('booking.step.review')} step={2} onClose={onClose} />

      <ScrollView contentContainerStyle={{ padding: app.spacing.lg, gap: app.spacing.lg }}>
        {draft.hold && (
          <HoldCountdownBanner
            expiresAt={draft.hold.expires_at}
            activeLabel={(time) => t('booking.hold.active', { time })}
            expiredLabel={t('booking.hold.expired')}
          />
        )}

        {service && (
          <BookingSummaryCard
            salonName={draft.salonName ?? ''}
            serviceName={service.name}
            duration={formatDuration(service.duration_minutes)}
            staffLine={
              draft.staffName ? t('booking.confirmation.with', { name: draft.staffName }) : undefined
            }
            dateTimeLabel={draft.date ? `${formatLongDate(draft.date)} · ${slotTime}` : dateTimeLabel}
            price={formatPrice(service.price_display)}
            address={draft.salonAddress}
          />
        )}

        <View style={{ gap: app.spacing.xs }}>
          <GText variant="label" color="muted">
            {t('booking.review.bookingAs')}
          </GText>
          <GText variant="body">
            {[me?.first_name, me?.last_name].filter(Boolean).join(' ')}
            {me?.phone ? ` · ${me.phone}` : ''}
          </GText>
        </View>

        <GText variant="caption" color="faint">
          {t('booking.review.cancelPolicy', { hours: CANCEL_NOTICE_HOURS })}
        </GText>

        {errorMsg && (
          <GText variant="caption" color="danger">
            {errorMsg}
          </GText>
        )}
      </ScrollView>

      <GBottomBar>
        <GButton
          fullWidth
          label={t('booking.review.confirm')}
          onPress={onConfirm}
          loading={createBooking.isPending}
          disabled={createBooking.isPending}
          testID="booking-review-confirm"
        />
      </GBottomBar>
    </GScreen>
  );
}
