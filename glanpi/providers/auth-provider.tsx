import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { setOnAuthFailure, tokenStorage, type User } from '@/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  /** Persist tokens + user after a successful phone verification. */
  signIn: (tokens: { access: string; refresh: string }, user: User) => Promise<void>;
  /** Clear tokens and cached server state. */
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the session lifecycle: hydrates tokens from the keychain at boot, exposes
 * sign-in/out, and reacts to a refresh failure (registered on the API client)
 * by dropping to the unauthenticated state.
 *
 * Must be mounted inside `QueryClientProvider` — it clears the query cache on
 * sign-out.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const signIn = useCallback<AuthContextValue['signIn']>(async (tokens, nextUser) => {
    await tokenStorage.setTokens(tokens);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback<AuthContextValue['signOut']>(async () => {
    await tokenStorage.clearTokens();
    setUser(null);
    setStatus('unauthenticated');
    queryClient.clear();
  }, [queryClient]);

  // Boot: load persisted tokens and register the refresh-failure handler.
  useEffect(() => {
    let active = true;

    // Refresh ultimately failed → tokens already cleared by the client.
    setOnAuthFailure(() => {
      setUser(null);
      setStatus('unauthenticated');
      queryClient.clear();
    });

    (async () => {
      await tokenStorage.hydrate();
      if (!active) return;
      // Optimistic: a stored access token means we're authenticated. The first
      // protected request validates it (and refreshes transparently on 401).
      setStatus(
        tokenStorage.getAccessTokenSync() ? 'authenticated' : 'unauthenticated',
      );
    })();

    return () => {
      active = false;
      setOnAuthFailure(null);
    };
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
