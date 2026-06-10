import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { GText } from './g-text';

export type GOtpInputProps = {
  /** Number of digit boxes. Default: 4. */
  length?: number;
  value: string;
  onChange: (value: string) => void;
  /** Fired once the input reaches `length` digits. */
  onComplete?: (value: string) => void;
  /** Flash the boxes in the danger color (e.g. wrong code). */
  error?: boolean;
  autoFocus?: boolean;
  /** Forwarded to the hidden master input (E2E + integration-test selector). */
  testID?: string;
};

/**
 * Fixed-length code entry. A single hidden master `TextInput` (with SMS
 * one-time-code autofill) drives N visible boxes, and exposes itself as one
 * accessible field for screen readers. Filled boxes get an `accent` border;
 * `error` flips every box to `danger`.
 */
export function GOtpInput({
  length = 4,
  value,
  onChange,
  onComplete,
  error = false,
  autoFocus = true,
  testID,
}: GOtpInputProps) {
  const { app } = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const cells = Array.from({ length }, (_, i) => value[i] ?? '');
  // The "active" cell is the next empty one (or the last while full).
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={styles.row}
      accessibilityRole="none"
      accessibilityLabel="Pole na kod weryfikacyjny"
    >
      {cells.map((digit, i) => {
        const isActive = focused && i === activeIndex;
        const borderColor = error
          ? app.colors.danger
          : digit
            ? app.colors.accent
            : isActive
              ? app.colors.primary
              : app.colors.outline;
        return (
          <View
            key={i}
            style={[
              styles.box,
              {
                borderColor,
                borderRadius: app.radius.md,
                backgroundColor: app.colors.surface,
              },
            ]}
          >
            <GText variant="title" color={error ? 'danger' : 'default'}>
              {digit}
            </GText>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        testID={testID}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        style={styles.hiddenInput}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  box: {
    width: 56,
    height: 64,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Covers the whole row, fully transparent — it captures keystrokes/autofill
  // while the visible boxes render the digits.
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
});
