# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start          # start dev server (Expo Go or dev build via QR)
expo run:ios            # build and run on iOS simulator
expo run:android        # build and run on Android emulator
npm run lint            # ESLint (eslint-config-expo)
```

## Architecture

**Beautify** is a mobile-first beauty salon booking app. Users discover salons through an Instagram-style feed and book appointments — phone + SMS OTP is the only auth method (no email/password).

### Routing

Expo Router (file-based). Entry: `expo-router/entry`.

- `app/_layout.tsx` — root Stack, wraps everything in `ThemeProvider`
- `app/(tabs)/_layout.tsx` — bottom tab navigator (4 tabs: Explore, Find, Calendar, Profile)
- Modals are Stack screens with `presentation: 'modal'`

### Two roles, one account

One phone number = one account. Default role: **Client** (browses feed, books appointments). **Salon** role is opt-in from the Profile tab and adds salon-management screens. Both roles can be active simultaneously on the same account.

### Theming

Light/dark via `useColorScheme`. `constants/theme.ts` exports `Colors` (light/dark token map) and `Fonts` (platform-specific families). `ThemedText` / `ThemedView` consume these via `useThemeColor`.

### Path alias

`@/` maps to the project root (`tsconfig.json`). Always use `@/` imports — never relative `../../` paths.

## Tech stack rules

**New Architecture only.** `newArchEnabled: true` in `app.json`. React Compiler is enabled (`reactCompiler: true`). Do not use APIs incompatible with Fabric/JSI.

**Animations — Reanimated only.** Never use `Animated` from `react-native`. Use `react-native-reanimated` for all animations, transitions, and gesture-driven UI. `react-native-worklets` is available as the worklets runtime.

**Styles outside components.** All styles must be defined with `StyleSheet.create()` at the bottom of the file or in a dedicated styles file. Never use inline style objects.

**Lists — LegendList only.** Use `@legendapp/list` (LegendList) for all scrollable lists, including the feed. Do not use `FlatList`, `FlashList`, or `ScrollView` for list rendering.

**API queries — TanStack Query.** Use `@tanstack/react-query` for all server-state fetching, caching, and mutations. No raw `fetch`/`axios` calls inside components.

**i18n — all visible text via translation keys.** All user-facing strings must live in the i18n resource file (Polish as default locale) and be referenced by key in components. Never hardcode display text in JSX.
