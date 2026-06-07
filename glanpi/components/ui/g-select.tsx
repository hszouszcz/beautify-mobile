import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, TouchableRipple } from 'react-native-paper';

import { useAppTheme } from '@/theme';

import { GText } from './g-text';

export type GSelectOption<T extends string> = {
  value: T;
  label: string;
};

export type GSelectProps<T extends string> = {
  value: T | null;
  options: GSelectOption<T>[];
  onChange: (value: T) => void;
  /** Shown when nothing is selected, e.g. "Select your city". */
  placeholder: string;
  leadingIcon?: string;
};

/**
 * Dropdown field (anchored Menu) — e.g. the "Select your city" picker on the
 * welcome screen. Outlined pill-ish field with a chevron.
 */
export function GSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  leadingIcon,
}: GSelectProps<T>) {
  const { app } = useAppTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <TouchableRipple
          onPress={() => setOpen(true)}
          borderless
          style={[
            styles.field,
            { borderColor: app.colors.outline, borderRadius: app.radius.md },
          ]}
        >
          <View style={styles.fieldRow}>
            <GText variant="body" color={selected ? 'default' : 'muted'}>
              {selected ? selected.label : placeholder}
            </GText>
            <GText variant="body" color="muted">
              ▾
            </GText>
          </View>
        </TouchableRipple>
      }
      contentStyle={{ backgroundColor: app.colors.surface }}
    >
      {options.map((opt) => (
        <Menu.Item
          key={opt.value}
          title={opt.label}
          leadingIcon={leadingIcon}
          titleStyle={{ color: app.colors.text }}
          onPress={() => {
            onChange(opt.value);
            setOpen(false);
          }}
        />
      ))}
    </Menu>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
