import { useMutation } from '@tanstack/react-query';

import {
  initiatePhoneAuth,
  verifyPhoneAuth,
  type ApiError,
  type InitiatePhoneAuthResponse,
  type VerifyPhoneAuthRequest,
  type VerifyPhoneAuthResponse,
} from '@/api';

import { useAuth } from './use-auth';

/**
 * Step 1: request an SMS code. On a 429 the resulting `ApiError` carries
 * `retryAfterSeconds` (from `resend_wait_seconds`) so the UI can back off.
 */
export function useInitiatePhoneAuth() {
  return useMutation<InitiatePhoneAuthResponse, ApiError, { phone: string }>({
    mutationFn: ({ phone }) => initiatePhoneAuth({ phone }),
  });
}

/**
 * Step 2: verify the code. On success the JWT pair + user are persisted via the
 * session (`signIn`), flipping the app to the authenticated state.
 */
export function useVerifyPhoneAuth() {
  const { signIn } = useAuth();
  return useMutation<VerifyPhoneAuthResponse, ApiError, VerifyPhoneAuthRequest>({
    mutationFn: (body) => verifyPhoneAuth(body),
    onSuccess: async (data) => {
      await signIn(
        { access: data.access, refresh: data.refresh },
        data.user,
      );
    },
  });
}
