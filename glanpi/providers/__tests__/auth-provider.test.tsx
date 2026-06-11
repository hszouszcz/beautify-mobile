import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAuth } from '@/hooks/use-auth';
import { AuthProvider } from '@/providers/auth-provider';
import { makeUser } from '@/test/utils';

// Replace only `setOnAuthFailure` so we can capture the handler AuthProvider
// registers; everything else (tokenStorage, types) stays real.
let registeredFailureHandler: (() => void) | null = null;
jest.mock('@/api', () => {
  const actual = jest.requireActual('@/api');
  return {
    ...actual,
    setOnAuthFailure: (fn: (() => void) | null) => {
      registeredFailureHandler = fn;
    },
  };
});

const { tokenStorage } = jest.requireActual('@/api') as typeof import('@/api');

/**
 * Mount `useAuth` inside QueryClient + AuthProvider. The boot effect reads the
 * token mirror, so each test seeds it first via the public token API (this is
 * robust to the module-level `hydrated` flag — the optimistic boot check reads
 * `getAccessTokenSync()`).
 */
function setup(client: QueryClient) {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    ),
  });
}

describe('AuthProvider', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    jest.restoreAllMocks();
  });

  it('boots to unauthenticated when no token is stored', async () => {
    await tokenStorage.clearTokens();
    const { result } = setup(client);
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.user).toBeNull();
  });

  it('boots to authenticated when a token is present', async () => {
    await tokenStorage.setTokens({ access: 'a1', refresh: 'r1' });
    const { result } = setup(client);
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
  });

  it('signIn persists tokens, sets the user, and flips to authenticated', async () => {
    await tokenStorage.clearTokens();
    const user = makeUser();
    const { result } = setup(client);
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await result.current.signIn({ access: 'tok', refresh: 'ref' }, user);
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.user).toEqual(user);
    expect(tokenStorage.getAccessTokenSync()).toBe('tok');
  });

  it('signOut clears tokens, user, and the query cache', async () => {
    await tokenStorage.setTokens({ access: 'a1', refresh: 'r1' });
    const clearSpy = jest.spyOn(client, 'clear');
    const { result } = setup(client);
    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
    expect(tokenStorage.getAccessTokenSync()).toBeNull();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('drops to unauthenticated when the API client reports a refresh failure', async () => {
    await tokenStorage.setTokens({ access: 'a1', refresh: 'r1' });
    const clearSpy = jest.spyOn(client, 'clear');

    const { result } = setup(client);
    await waitFor(() => expect(registeredFailureHandler).not.toBeNull());

    act(() => registeredFailureHandler!());

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(clearSpy).toHaveBeenCalled();
  });
});
