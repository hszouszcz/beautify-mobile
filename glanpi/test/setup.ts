/**
 * Global Jest setup (runs after the test framework is installed, before each
 * suite). Owns the cross-cutting mocks every test needs so individual specs stay
 * focused on behavior. See the testing plan, Part A3.
 */

// RNTL ≥12.4 auto-registers its jest matchers on import — no extend-expect needed.

// --- Reanimated: render animated components without a real worklet runtime. ---
// jest-expo wires most of the Expo SDK, but Reanimated needs its own jest mock.
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// Gesture Handler ships a jest setup that stubs its native module.
require('react-native-gesture-handler/jestSetup');

// Safe-area: use the library's jest mock so insets resolve synchronously
// (otherwise SafeAreaProvider measures async and children never render).
jest.mock('react-native-safe-area-context', () =>
  // The library's mock is a default-export object; spread it as named exports.
  require('react-native-safe-area-context/jest/mock').default,
);

// --- expo-secure-store: in-memory keychain so token-storage/auth are testable. ---
jest.mock('expo-secure-store', () => {
  let store: Record<string, string> = {};
  return {
    // Exposed so specs can fully reset keychain state between cases.
    __reset: () => {
      store = {};
    },
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
});

// LegendList virtualizes via native layout, which doesn't happen in jsdom — it
// would render zero rows. Swap in a deterministic list that renders the header,
// every row (or the empty component), so screens are testable.
jest.mock('@legendapp/list/react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const resolve = (C: unknown) =>
    typeof C === 'function' ? React.createElement(C as never) : (C ?? null);
  const LegendList = ({
    data = [],
    renderItem,
    keyExtractor,
    ListHeaderComponent,
    ListEmptyComponent,
    ItemSeparatorComponent,
  }: any) => {
    const rows =
      data.length === 0
        ? resolve(ListEmptyComponent)
        : data.map((item: unknown, index: number) =>
            React.createElement(
              React.Fragment,
              { key: keyExtractor ? keyExtractor(item, index) : index },
              index > 0 ? resolve(ItemSeparatorComponent) : null,
              renderItem({ item, index }),
            ),
          );
    return React.createElement(View, null, resolve(ListHeaderComponent), rows);
  };
  return { LegendList };
});

// Haptics are fire-and-forget; no-op them so booking interactions don't throw.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Initialize i18n with the real Polish resources so `t()` returns real copy and
// tests catch missing translation keys.
import '@/i18n';

// Keep test output readable: silence the known-noisy Reanimated/Expo logs.
const originalWarn = console.warn;
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? '');
    if (msg.includes('useNativeDriver') || msg.includes('Reanimated')) return;
    originalWarn(...(args as []));
  });
});
