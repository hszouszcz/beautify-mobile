import { useQuery } from '@tanstack/react-query';

import { getMe, queryKeys, type ApiError, type User } from '@/api';

import { useAuth } from './use-auth';

/**
 * Current user's profile (PROTECTED). Disabled while unauthenticated so it never
 * fires without a token.
 */
export function useMe() {
  const { status } = useAuth();
  return useQuery<User, ApiError>({
    queryKey: queryKeys.me(),
    queryFn: getMe,
    enabled: status === 'authenticated',
  });
}
