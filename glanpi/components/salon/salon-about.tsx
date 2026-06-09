import { useState } from 'react';
import { View } from 'react-native';

import { GPressable, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type SalonAboutProps = {
  title: string;
  description: string;
  moreLabel: string;
  lessLabel: string;
};

/** "O salonie" section: clamped description with a more/less expander. */
export function SalonAbout({ title, description, moreLabel, lessLabel }: SalonAboutProps) {
  const { app } = useAppTheme();
  const [expanded, setExpanded] = useState(false);

  if (!description.trim()) return null;

  return (
    <View style={{ gap: app.spacing.xs }}>
      <GText variant="titleSmall">{title}</GText>
      <GText variant="body" color="muted" numberOfLines={expanded ? undefined : 3}>
        {description}
      </GText>
      <GPressable onPress={() => setExpanded((v) => !v)} borderless={false}>
        <GText variant="label" color="primary">
          {expanded ? lessLabel : moreLabel}
        </GText>
      </GPressable>
    </View>
  );
}
