import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

/**
 * Icon shim for PaperProvider's `settings.icon`. Routes Paper's icon rendering
 * through `@expo/vector-icons` so we never have to link
 * `react-native-vector-icons` natively. All Paper icon names are
 * MaterialCommunityIcons names.
 */
type PaperIconProps = {
  name: string;
  color?: string;
  size: number;
  direction?: 'rtl' | 'ltr';
  allowFontScaling?: boolean;
};

export function PaperIcon({ name, color, size, allowFontScaling }: PaperIconProps) {
  return (
    <MaterialCommunityIcons
      name={name as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
      color={color}
      size={size}
      allowFontScaling={allowFontScaling}
    />
  );
}
