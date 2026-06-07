import { useTheme } from 'react-native-paper';

import { glanpiLightTheme } from './paper-theme';

/**
 * The full app theme type, derived from the light theme (light & dark share the
 * exact same shape). Use this everywhere a theme type is needed.
 */
export type AppTheme = typeof glanpiLightTheme;

/**
 * Typed replacement for Paper's `useTheme`. Always use this inside `G*`
 * components so `theme.app.colors / spacing / radius / elevation` are typed.
 */
export const useAppTheme = () => useTheme<AppTheme>();
