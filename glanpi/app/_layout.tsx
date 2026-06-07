import '@/i18n';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProviders } from '@/providers/app-providers';
import {
  fontAssets,
  glanpiDarkTheme,
  glanpiLightTheme,
  navigationDarkTheme,
  navigationLightTheme,
} from '@/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts(fontAssets);

  // Dark-ready: structure is in place, but we resolve to the light theme for
  // both schemes until the dark palette is filled (theme/tokens/colors.ts).
  const isDark = false && colorScheme === 'dark';
  const paperTheme = isDark ? glanpiDarkTheme : glanpiLightTheme;
  const navTheme = isDark ? navigationDarkTheme : navigationLightTheme;

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppProviders theme={paperTheme}>
      <ThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="post/[id]" options={{ title: '' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppProviders>
  );
}
