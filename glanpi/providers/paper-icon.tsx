import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

/**
 * Icon shim for PaperProvider's `settings.icon`. Routes Paper's icon rendering
 * through `@expo/vector-icons` so we never have to link
 * `react-native-vector-icons` natively. All Paper icon names are
 * MaterialCommunityIcons names.
 *
 * IMPORTANT: Paper invokes this as a plain function (`icon?.({...})`) rather
 * than mounting it as `<PaperIcon/>` (see react-native-paper's `Icon`). With
 * React Compiler enabled (`experiments.reactCompiler`), a compiled component
 * gets a `useMemoCache` hook injected at its top — which, called outside React's
 * render dispatcher, throws "Invalid hook call". The `'use no memo'` directive
 * opts this render callback out of the compiler so it stays a plain function.
 */
type PaperIconProps = {
  name: string;
  color?: string;
  size: number;
  direction?: 'rtl' | 'ltr';
  allowFontScaling?: boolean;
};

export function PaperIcon({ name, color, size, allowFontScaling }: PaperIconProps) {
  'use no memo';
  return (
    <MaterialCommunityIcons
      name={name as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
      color={color}
      size={size}
      allowFontScaling={allowFontScaling}
    />
  );
}
