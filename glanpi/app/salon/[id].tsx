import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { GEmptyState, GScreen } from '@/components/ui';

/**
 * Salon detail placeholder. Tapping a Find-list card or a map pin lands here so
 * taps don't dead-end. The full salon detail + tap-to-book flow (PRD §5.2
 * items 3–11) is out of scope for the Find milestone.
 */
export default function SalonDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <GScreen>
      <GEmptyState
        icon="storefront-outline"
        title={t('common.comingSoon')}
        description={`salon #${id}`}
      />
    </GScreen>
  );
}
