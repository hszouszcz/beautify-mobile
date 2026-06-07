import { StyleSheet } from 'react-native';
import { Searchbar, type SearchbarProps } from 'react-native-paper';

import { useAppTheme } from '@/theme';

export type GSearchBarProps = Omit<SearchbarProps, 'theme'> & {
  /** Show the trailing microphone (voice search) icon. Default: true. */
  showVoice?: boolean;
  onVoicePress?: () => void;
};

/**
 * Pill-shaped search input matching the mockups ("Search inspiration…" /
 * "Search for salon or service…"). Leading search icon + optional trailing mic.
 */
export function GSearchBar({
  showVoice = true,
  onVoicePress,
  style,
  inputStyle,
  ...rest
}: GSearchBarProps) {
  const { app } = useAppTheme();

  return (
    <Searchbar
      mode="bar"
      elevation={0}
      icon="magnify"
      traileringIcon={showVoice ? 'microphone' : undefined}
      onTraileringIconPress={showVoice ? onVoicePress : undefined}
      style={[
        styles.bar,
        {
          backgroundColor: app.colors.backgroundStrong,
          borderRadius: app.radius.pill,
        },
        style,
      ]}
      inputStyle={[styles.input, inputStyle]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  bar: { height: 48 },
  input: { minHeight: 0, alignSelf: 'center' },
});
