/**
 * Token storage keeps a synchronous in-memory mirror of the keychain so the
 * axios request interceptor can read the access token without awaiting. These
 * tests guard that mirror against drift. Modules are reset per case because the
 * mirror + `hydrated` flag are module-level state.
 */

const ACCESS_KEY = 'beautify.access_token';
const REFRESH_KEY = 'beautify.refresh_token';

type SecureStoreMock = typeof import('expo-secure-store') & { __reset: () => void };
type TokenStorage = typeof import('@/api/token-storage');

function freshModules(): { secureStore: SecureStoreMock; storage: TokenStorage } {
  let secureStore!: SecureStoreMock;
  let storage!: TokenStorage;
  jest.isolateModules(() => {
    secureStore = require('expo-secure-store');
    secureStore.__reset();
    storage = require('@/api/token-storage');
  });
  return { secureStore, storage };
}

describe('token-storage', () => {
  it('reads nothing before hydrate', () => {
    const { storage } = freshModules();
    expect(storage.getAccessTokenSync()).toBeNull();
    expect(storage.getRefreshTokenSync()).toBeNull();
  });

  it('hydrate loads persisted tokens into the sync mirror', async () => {
    const { secureStore, storage } = freshModules();
    await secureStore.setItemAsync(ACCESS_KEY, 'a1');
    await secureStore.setItemAsync(REFRESH_KEY, 'r1');

    await storage.hydrate();

    expect(storage.getAccessTokenSync()).toBe('a1');
    expect(storage.getRefreshTokenSync()).toBe('r1');
  });

  it('hydrate is idempotent', async () => {
    const { secureStore, storage } = freshModules();
    await secureStore.setItemAsync(ACCESS_KEY, 'a1');
    await storage.hydrate();
    // A second hydrate must not re-read (e.g. after tokens changed in memory).
    await secureStore.setItemAsync(ACCESS_KEY, 'a2');
    await storage.hydrate();
    expect(storage.getAccessTokenSync()).toBe('a1');
  });

  it('setTokens writes through to mirror and keychain immediately', async () => {
    const { secureStore, storage } = freshModules();
    await storage.setTokens({ access: 'a1', refresh: 'r1' });

    expect(storage.getAccessTokenSync()).toBe('a1');
    expect(storage.getRefreshTokenSync()).toBe('r1');
    expect(await secureStore.getItemAsync(ACCESS_KEY)).toBe('a1');
    expect(await secureStore.getItemAsync(REFRESH_KEY)).toBe('r1');
  });

  it('setTokens without refresh keeps the existing refresh token', async () => {
    const { storage } = freshModules();
    await storage.setTokens({ access: 'a1', refresh: 'r1' });
    await storage.setTokens({ access: 'a2' }); // refresh endpoint returns access only

    expect(storage.getAccessTokenSync()).toBe('a2');
    expect(storage.getRefreshTokenSync()).toBe('r1');
  });

  it('clearTokens wipes mirror and keychain', async () => {
    const { secureStore, storage } = freshModules();
    await storage.setTokens({ access: 'a1', refresh: 'r1' });
    await storage.clearTokens();

    expect(storage.getAccessTokenSync()).toBeNull();
    expect(storage.getRefreshTokenSync()).toBeNull();
    expect(await secureStore.getItemAsync(ACCESS_KEY)).toBeNull();
    expect(await secureStore.getItemAsync(REFRESH_KEY)).toBeNull();
  });
});
