import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type HoldCountdownBannerProps = {
  /** ISO timestamp when the hold expires. */
  expiresAt: string;
  /** Build the active copy from the live mm:ss, e.g. (time) => `Termin … ${time}`. */
  activeLabel: (time: string) => string;
  expiredLabel: string;
  onExpire?: () => void;
};

function remainingSeconds(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Calm live countdown for an active slot hold (design §5.3/§5.6). */
export function HoldCountdownBanner({
  expiresAt,
  activeLabel,
  expiredLabel,
  onExpire,
}: HoldCountdownBannerProps) {
  const { app } = useAppTheme();
  const [seconds, setSeconds] = useState(() => remainingSeconds(expiresAt));
  const firedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const next = remainingSeconds(expiresAt);
      setSeconds(next);
      if (next === 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  const expired = seconds === 0;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: app.colors.backgroundStrong,
          borderRadius: app.radius.md,
          padding: app.spacing.md,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={expired ? 'lock-open-variant-outline' : 'lock-outline'}
        size={18}
        color={expired ? app.colors.danger : app.colors.textMuted}
      />
      <GText variant="label" color={expired ? 'danger' : 'muted'}>
        {expired ? expiredLabel : activeLabel(mmss(seconds))}
      </GText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
