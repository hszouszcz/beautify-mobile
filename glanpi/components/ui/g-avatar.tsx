import { Avatar } from 'react-native-paper';

export type GAvatarProps = {
  size?: number;
  /** Image URI. When omitted, initials are shown instead. */
  uri?: string;
  /** Fallback initials when there is no image. */
  initials?: string;
};

/**
 * Salon / staff avatar. Shows the photo when `uri` is set, otherwise initials.
 */
export function GAvatar({ size = 40, uri, initials = '?' }: GAvatarProps) {
  if (uri) {
    return <Avatar.Image size={size} source={{ uri }} />;
  }
  return <Avatar.Text size={size} label={initials} />;
}
