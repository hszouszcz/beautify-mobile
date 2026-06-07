import React from 'react';
import { useTranslation } from 'react-i18next';

import { GEmptyState, GScreen } from '@/components/ui';

export default function CalendarScreen() {
  const { t } = useTranslation();

  return (
    <GScreen>
      <GEmptyState title={t('common.comingSoon')} />
    </GScreen>
  );
}
