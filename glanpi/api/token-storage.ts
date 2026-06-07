import * as SecureStore from 'expo-secure-store';

/**
 * JWT storage backed by the device keychain (`expo-secure-store`).
 *
 * A module-level in-memory mirror lets the axios request interceptor read the
 * access token synchronously (no keychain round-trip per request). The keychain
 * is the source of truth on cold start: call `hydrate()` once at app boot.
 */

const ACCESS_KEY = 'beautify.access_token';
const REFRESH_KEY = 'beautify.refresh_token';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let hydrated = false;

/** Load persisted tokens into memory. Idempotent; safe to await at boot. */
export async function hydrate(): Promise<void> {
  if (hydrated) return;
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  accessToken = access;
  refreshToken = refresh;
  hydrated = true;
}

/** Synchronous read for the request interceptor. */
export function getAccessTokenSync(): string | null {
  return accessToken;
}

export function getRefreshTokenSync(): string | null {
  return refreshToken;
}

/**
 * Persist tokens (write-through to keychain + memory). `refresh` is optional:
 * the refresh endpoint returns only a new `access`, so we keep the existing
 * refresh token in that case.
 */
export async function setTokens(tokens: {
  access: string;
  refresh?: string;
}): Promise<void> {
  accessToken = tokens.access;
  const writes: Promise<void>[] = [SecureStore.setItemAsync(ACCESS_KEY, tokens.access)];
  if (tokens.refresh !== undefined) {
    refreshToken = tokens.refresh;
    writes.push(SecureStore.setItemAsync(REFRESH_KEY, tokens.refresh));
  }
  await Promise.all(writes);
}

/** Clear both tokens from memory and keychain (logout / refresh failure). */
export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
