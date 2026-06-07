import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { adaptNavigationTheme } from 'react-native-paper';

import { darkColors, lightColors } from './tokens/colors';

const { LightTheme, DarkTheme: AdaptedDark } = adaptNavigationTheme({
  reactNavigationLight: DefaultTheme,
  reactNavigationDark: DarkTheme,
});

/** React Navigation theme synced to the Glanpi palette (Expo Router chrome). */
export const navigationLightTheme = {
  ...LightTheme,
  colors: {
    ...LightTheme.colors,
    background: lightColors.background,
    card: lightColors.background,
    primary: lightColors.primary,
    text: lightColors.text,
    border: lightColors.outline,
  },
};

export const navigationDarkTheme = {
  ...AdaptedDark,
  colors: {
    ...AdaptedDark.colors,
    background: darkColors.background,
    card: darkColors.background,
    primary: darkColors.primary,
    text: darkColors.text,
    border: darkColors.outline,
  },
};
