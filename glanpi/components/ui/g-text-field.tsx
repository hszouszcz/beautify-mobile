import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  HelperText,
  TextInput,
  type TextInputProps,
} from 'react-native-paper';

import { useAppTheme } from '@/theme';

export type GTextFieldProps = Omit<TextInputProps, 'theme' | 'mode' | 'error' | 'left' | 'right'> & {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Error message; presence also flips the field to its danger state. */
  error?: string;
  /** Fixed leading text affix, e.g. the "+48" phone prefix. */
  prefix?: string;
  /** Style for the wrapping block (label + field + helper). */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Labeled outlined text input (Paper `TextInput`). Token-driven, 56pt tall to
 * match `GSelect`, with a `danger` border + helper text on error. Hides Paper so
 * screens never import it directly.
 */
export function GTextField({
  label,
  value,
  onChangeText,
  error,
  prefix,
  style,
  containerStyle,
  ...rest
}: GTextFieldProps) {
  const { app } = useAppTheme();
  const hasError = !!error;

  return (
    <View style={containerStyle}>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={hasError}
        outlineColor={app.colors.outline}
        activeOutlineColor={app.colors.primary}
        style={[styles.input, { backgroundColor: app.colors.surface }, style]}
        outlineStyle={{ borderRadius: app.radius.md }}
        left={prefix ? <TextInput.Affix text={prefix} /> : undefined}
        {...rest}
      />
      {hasError && (
        <HelperText type="error" visible={hasError}>
          {error}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { height: 56 },
});
