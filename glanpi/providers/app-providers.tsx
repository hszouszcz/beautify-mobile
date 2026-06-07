import { QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { glanpiLightTheme } from '@/theme';

import { PaperIcon } from './paper-icon';
import { queryClient } from './query-client';

const paperSettings = { icon: PaperIcon };

/**
 * Single app-wide provider stack (outer → inner):
 * GestureHandlerRootView → SafeAreaProvider → QueryClientProvider → PaperProvider.
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
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme} settings={paperSettings}>
            {children}
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
