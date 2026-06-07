import { StyleSheet } from 'react-native';
import { Chip, type ChipProps } from 'react-native-paper';

import { useAppTheme } from '@/theme';

export type GChipProps = Omit<ChipProps, 'theme' | 'selected' | 'children'> & {
  label: string;
  selected?: boolean;
};

/**
 * Filter chip, e.g. feed categories (hair / makeup / nails / skin → `post_type`).
 * Selected chips fill with the brand brown.
 */
export function GChip({ label, selected = false, style, ...rest }: GChipProps) {
  const { app } = useAppTheme();

  return (
    <Chip
      selected={selected}
      showSelectedOverlay={false}
      showSelectedCheck={false}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? app.colors.accent : app.colors.surface,
          borderColor: app.colors.outline,
          borderRadius: app.radius.pill,
        },
        style,
      ]}
      textStyle={{ color: selected ? app.colors.onAccent : app.colors.textMuted }}
      {...rest}
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: StyleSheet.hairlineWidth },
});
