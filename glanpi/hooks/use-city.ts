import { useContext } from 'react';

import { CityContext, type CityContextValue } from '@/providers/city-provider';

export function useCity(): CityContextValue {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return ctx;
}
