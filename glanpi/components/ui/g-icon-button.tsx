import { IconButton, type IconButtonProps } from 'react-native-paper';

export type GIconButtonProps = Omit<IconButtonProps, 'theme'>;

/**
 * Branded icon button (MaterialCommunityIcons name via `icon`). Thin wrapper so
 * callers never import Paper directly. e.g. mic, map controls, close.
 */
export function GIconButton(props: GIconButtonProps) {
  return <IconButton {...props} />;
}
