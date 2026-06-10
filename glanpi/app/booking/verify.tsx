import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { queryKeys, resendCode, type ApiError } from '@/api';
import { BookingModalHeader, HoldCountdownBanner } from '@/components/booking';
import {
  GBottomBar,
  GButton,
  GOtpInput,
  GScreen,
  GSpinner,
  GText,
} from '@/components/ui';
import { useCreateBooking } from '@/hooks/use-create-booking';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { useVerifyPhoneAuth } from '@/hooks/use-phone-auth';
import { track } from '@/lib/analytics';
import { useBookingDraft } from '@/providers/booking-draft-provider';
import { useAppTheme } from '@/theme';

type Phase = 'code' | 'creating' | 'createError';

/**
 * Booking · Step 4 — SMS verification + create (design §5.4, plan §8.4). On a
 * valid code: sign in → (PATCH name if new) → create the booking → Confirmation.
 * A slot-taken failure recovers by returning to Schedule (now authenticated, so
 * the next pick goes straight to Review).
 */
export default function BookingVerifyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { app } = useAppTheme();
  const queryClient = useQueryClient();
  const { draft, set } = useBookingDraft();

  const verify = useVerifyPhoneAuth();
  const updateProfile = useUpdateProfile();
  const createBooking = useCreateBooking();

  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<Phase>('code');
  const [codeError, setCodeError] = useState<string | undefined>(undefined);
  const [cooldown, setCooldown] = useState(draft.resendWaitSeconds ?? 30);

  const resend = useMutation<unknown, ApiError, void>({
    mutationFn: () => resendCode({ phone: draft.phone! }),
    onSuccess: (res) => {
      const wait = (res as { resend_wait_seconds?: number }).resend_wait_seconds ?? 30;
      setCooldown(wait);
    },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const runCreate = async (needName: boolean) => {
    setPhase('creating');
    try {
      if (needName && draft.name) {
        await updateProfile.mutateAsync({
          first_name: draft.name.first,
          last_name: draft.name.last,
        });
      }
      const res = await createBooking.mutateAsync({
        salon: draft.salonId!,
        service: draft.service!.id,
        staff: draft.staffId!,
        start_time: draft.slot!.start_datetime,
      });
      set({ createdBooking: res.booking });
      track('booking_created', { status: res.booking.status });
      router.replace('/booking/confirmation');
    } catch (err) {
      handleCreateError(err as ApiError);
    }
  };

  const handleCreateError = (err: ApiError) => {
    // Slot taken → recover via Schedule (the user is authenticated now).
    if (err.status === 400 || err.status === 409) {
      const msg = err.message?.toLowerCase() ?? '';
      const isLimit = msg.includes('limit') || msg.includes('maksy');
      if (!isLimit) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.bookings.availability(
            draft.salonId ?? '',
            draft.service?.id ?? '',
            draft.staffId ?? '',
            draft.date ?? '',
          ),
        });
        set({ slot: undefined });
        router.replace('/booking/schedule');
        return;
      }
    }
    setPhase('createError');
  };

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

  const onComplete = (value: string) => {
    setCodeError(undefined);
    verify.mutate(
      { phone: draft.phone!, code: value },
      {
        onSuccess: (data) => {
          runCreate(data.is_new_user || !data.user.first_name);
        },
        onError: (err) => {
          setCode('');
          setCodeError(
            err.status === 401 ? t('booking.verify.expired') : t('booking.verify.wrong'),
          );
        },
      },
    );
  };

  if (phase === 'creating' || verify.isPending) {
    return (
      <GScreen edges={['top']} tone="background">
        <View style={styles.center}>
          <GSpinner size="large" />
          <GText variant="body" color="muted">
            {t('booking.verify.creating')}
          </GText>
        </View>
      </GScreen>
    );
  }

  return (
    <GScreen edges={[]} padded={false} tone="background">
      <BookingModalHeader title={t('booking.step.verify')} step={2} onClose={onClose} />

      <View style={{ padding: app.spacing.lg, gap: app.spacing.lg }}>
        {draft.hold && (
          <HoldCountdownBanner
            expiresAt={draft.hold.expires_at}
            activeLabel={(time) => t('booking.hold.active', { time })}
            expiredLabel={t('booking.hold.expired')}
          />
        )}

        <View style={{ gap: app.spacing.xs }}>
          <GText variant="title">{t('booking.verify.title')}</GText>
          <GText variant="body" color="muted">
            {t('booking.verify.sentTo', { hint: draft.phoneHint ?? draft.phone })}
          </GText>
        </View>

        <GOtpInput
          length={4}
          testID="otp-input"
          value={code}
          onChange={(v) => {
            setCode(v);
            if (codeError) setCodeError(undefined);
          }}
          onComplete={onComplete}
          error={!!codeError}
        />

        {codeError && (
          <GText variant="caption" color="danger" align="center">
            {codeError}
          </GText>
        )}

        {phase === 'createError' && (
          <View style={styles.center}>
            <GText variant="body" color="danger" align="center">
              {t('booking.error.limit')}
            </GText>
          </View>
        )}

        <View style={styles.resend}>
          <GText variant="caption" color="muted">
            {t('booking.verify.noCode')}
          </GText>
          <GButton
            kind="text"
            label={
              cooldown > 0
                ? t('booking.verify.resendIn', { seconds: cooldown })
                : t('booking.verify.resend')
            }
            disabled={cooldown > 0 || resend.isPending}
            onPress={() => resend.mutate()}
          />
        </View>
      </View>

      {phase === 'createError' && (
        <GBottomBar>
          <GButton
            fullWidth
            label={t('booking.error.generic')}
            onPress={() => router.dismissAll()}
          />
        </GBottomBar>
      )}
    </GScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  resend: { alignItems: 'center', gap: 2 },
});
