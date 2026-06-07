import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GEmptyState, GScreen } from '@/components/ui';

/**
 * Post detail placeholder. Tapping a feed tile lands here so taps don't
 * dead-end. The full post/salon detail + tap-to-book flow (PRD §5.2 items
 * 3–11) is out of scope for the Explore milestone.
 */
export default function PostDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <GScreen>
      <GEmptyState
        icon="image-outline"
        title={t('common.comingSoon')}
        description={`post #${id}`}
      />
    </GScreen>
  );
}
