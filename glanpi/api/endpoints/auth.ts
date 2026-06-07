import { apiClient } from '../client';
import { AUTH_PATHS } from '../config';
import type {
  InitiatePhoneAuthRequest,
  InitiatePhoneAuthResponse,
  RefreshTokenResponse,
  VerifyPhoneAuthRequest,
  VerifyPhoneAuthResponse,
} from '../types';

/**
 * Phone + SMS authentication. These are the only auth endpoints (no
 * email/password). All are public — they carry no Bearer and are exempt from
 * the 401 refresh flow (see AUTH_PATHS in client.ts).
 */

/** Start the login/register flow — sends an SMS code. */
export async function initiatePhoneAuth(
  body: InitiatePhoneAuthRequest,
): Promise<InitiatePhoneAuthResponse> {
  const { data } = await apiClient.post<InitiatePhoneAuthResponse>(
    AUTH_PATHS.initiate,
    body,
  );
  return data;
}

/** Verify the SMS code and receive the user + JWT pair. */
export async function verifyPhoneAuth(
  body: VerifyPhoneAuthRequest,
): Promise<VerifyPhoneAuthResponse> {
  const { data } = await apiClient.post<VerifyPhoneAuthResponse>(
    AUTH_PATHS.verify,
    body,
  );
  return data;
}

/** Resend the verification code. */
export async function resendCode(
  body: InitiatePhoneAuthRequest,
): Promise<InitiatePhoneAuthResponse> {
  const { data } = await apiClient.post<InitiatePhoneAuthResponse>(
    AUTH_PATHS.resend,
    body,
  );
  return data;
}

/**
 * Exchange a refresh token for a fresh access token. Note: the interceptor
 * handles refresh transparently for normal requests; this is exported for
 * explicit/manual use only.
 */
export async function refreshToken(refresh: string): Promise<RefreshTokenResponse> {
  const { data } = await apiClient.post<RefreshTokenResponse>(AUTH_PATHS.refresh, {
    refresh,
  });
  return data;
}
