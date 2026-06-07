import React, { createContext, useMemo, useState } from 'react';

export type CityContextValue = {
  city: string;
  setCity: (c: string) => void;
};

export const CityContext = createContext<CityContextValue | null>(null);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState('Warsaw');

  const value = useMemo<CityContextValue>(
    () => ({ city, setCity }),
    [city],
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}
