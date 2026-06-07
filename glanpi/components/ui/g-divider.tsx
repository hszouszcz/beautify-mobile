import { Divider } from 'react-native-paper';

import { useAppTheme } from '@/theme';

export type GDividerProps = {
  /** Vertical margin from the spacing scale. Default: 'none'. */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
};

/** Hairline divider in the brand outline color. */
export function GDivider({ spacing = 'none' }: GDividerProps) {
  const { app } = useAppTheme();
  const margin = spacing === 'none' ? 0 : app.spacing[spacing];

  return <Divider style={{ backgroundColor: app.colors.outline, marginVertical: margin }} />;
}
