import { Platform } from 'react-native';

/**
 * API runtime config. `EXPO_PUBLIC_*` vars are inlined into the bundle at build
 * time — after editing `.env`, restart Metro with `npx expo start --clear`.
 */

const RAW_API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.beautify.local/api';

/**
 * The Android emulator can't reach the host machine via `localhost` — it must
 * use the special alias `10.0.2.2`. Rewrite it so a single `localhost` env value
 * works on both the iOS simulator and the Android emulator in dev.
 */
function resolveBaseUrl(url: string): string {
  if (Platform.OS === 'android') {
    return url.replace(/(?:localhost|127\.0\.0\.1)/, '10.0.2.2');
  }
  return url;
}

/** Base origin of the Beautify DRF API, including the `/api` prefix. */
export const API_BASE_URL = resolveBaseUrl(RAW_API_URL);

/** Per-request timeout. Mobile networks are flaky; fail rather than hang. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Endpoint paths that must never trigger the 401 refresh-and-retry flow. */
export const AUTH_PATHS = {
  refresh: '/accounts/token/refresh/',
  initiate: '/accounts/auth/phone/initiate/',
  verify: '/accounts/auth/phone/verify/',
  resend: '/accounts/auth/phone/resend/',
} as const;
