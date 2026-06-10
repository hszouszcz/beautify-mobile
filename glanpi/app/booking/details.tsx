import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { BookingModalHeader, HoldCountdownBanner } from '@/components/booking';
import { GBottomBar, GButton, GScreen, GText, GTextField } from '@/components/ui';
import { useInitiatePhoneAuth } from '@/hooks/use-phone-auth';
import { track } from '@/lib/analytics';
import { isValidPL, toE164 } from '@/lib/phone';
import { useBookingDraft } from '@/providers/booking-draft-provider';
import { useAppTheme } from '@/theme';

/**
 * Booking · Step 3 — Your details (design §5.3). Unauthenticated only. Collects
 * exactly what's needed to make an account + booking: first name (required),
 * last name (optional), 9-digit PL phone → E.164. "Wyślij kod" initiates SMS.
 */
export default function BookingDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { app } = useAppTheme();
  const { draft, set } = useBookingDraft();
  const initiate = useInitiatePhoneAuth();

  const [first, setFirst] = useState(draft.name?.first ?? '');
  const [last, setLast] = useState(draft.name?.last ?? '');
  const [national, setNational] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // 429 backoff countdown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const phoneValid = isValidPL(national);
  const formValid = first.trim().length > 0 && phoneValid;

  const onSubmit = () => {
    const phone = toE164(national);
    initiate.mutate(
      { phone },
      {
        onSuccess: (res) => {
          set({
            name: { first: first.trim(), last: last.trim() },
            phone,
            phoneHint: res.phone_number_hint,
            resendWaitSeconds: res.resend_wait_seconds,
          });
          track('phone_submit', {});
          router.push('/booking/verify');
        },
        onError: (err) => {
          if (err.status === 429 && err.retryAfterSeconds) {
            setCooldown(err.retryAfterSeconds);
          }
        },
      },
    );
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

  const ctaLabel =
    cooldown > 0
      ? t('booking.error.rateLimit', { seconds: cooldown })
      : t('booking.details.sendCode');

  return (
    <GScreen edges={[]} padded={false} tone="background">
      <BookingModalHeader title={t('booking.step.details')} step={2} onClose={onClose} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: app.spacing.lg, gap: app.spacing.md }}
          keyboardShouldPersistTaps="handled"
        >
          {draft.hold && (
            <HoldCountdownBanner
              expiresAt={draft.hold.expires_at}
              activeLabel={(time) => t('booking.hold.active', { time })}
              expiredLabel={t('booking.hold.expired')}
            />
          )}

          <GText variant="body" color="muted">
            {t('booking.details.rationale')}
          </GText>

          <GTextField
            label={t('booking.details.firstName')}
            value={first}
            onChangeText={setFirst}
            autoComplete="name-given"
            testID="field-firstName"
          />
          <GTextField
            label={t('booking.details.lastName')}
            value={last}
            onChangeText={setLast}
            autoComplete="name-family"
            testID="field-lastName"
          />
          <GTextField
            label={t('booking.details.phone')}
            value={national}
            onChangeText={(text) => setNational(text.replace(/\D/g, '').slice(0, 9))}
            prefix="+48"
            keyboardType="number-pad"
            autoComplete="tel"
            testID="field-phone"
            error={national.length > 0 && !phoneValid ? t('booking.details.invalidPhone') : undefined}
          />

          <GText variant="caption" color="faint">
            {t('booking.details.smsHint')}
          </GText>

          {initiate.isError && initiate.error.status !== 429 && (
            <GText variant="caption" color="danger">
              {t('booking.error.generic')}
            </GText>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <GBottomBar>
        <GButton
          fullWidth
          label={ctaLabel}
          onPress={onSubmit}
          loading={initiate.isPending}
          disabled={!formValid || cooldown > 0 || initiate.isPending}
          testID="booking-details-send"
        />
      </GBottomBar>
    </GScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
