import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '@/i18n';
import { glanpiLightTheme } from '@/theme';
import { AuthProvider } from './auth-provider';
import { CityProvider } from './city-provider';
import { PaperIcon } from './paper-icon';
import { queryClient } from './query-client';

const paperSettings = { icon: PaperIcon };

/**
 * Single app-wide provider stack (outer → inner):
 * GestureHandlerRootView → SafeAreaProvider → I18nextProvider →
 * QueryClientProvider → AuthProvider → CityProvider → PaperProvider.
 *
 * `AuthProvider` sits inside `QueryClientProvider` (it clears the query cache on
 * sign-out) and wraps everything below so `useAuth`/`useMe` are reachable from
 * every screen, including the root-level booking modal.
 *
 * `theme` defaults to the light theme. Dark is wired structurally but resolves
 * to light until the dark palette is filled in (see `theme/tokens/colors.ts`).
 */
export function AppProviders({
  children,
  theme = glanpiLightTheme,
}: {
  children: React.ReactNode;
  theme?: typeof glanpiLightTheme;
}) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <CityProvider>
                <PaperProvider theme={theme} settings={paperSettings}>
                  {children}
                </PaperProvider>
              </CityProvider>
            </AuthProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
