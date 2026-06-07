import { useContext } from 'react';

import { AuthContext, type AuthContextValue } from '@/providers/auth-provider';

/** Access the session: status, current user, and sign-in/out actions. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
