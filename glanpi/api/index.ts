/**
 * Public surface of the API layer. Endpoint functions and types are consumed by
 * TanStack Query hooks (in `hooks/`) — components must not call these directly.
 */
export { apiClient, setOnAuthFailure } from './client';
export { API_BASE_URL } from './config';
export { ApiError, isApiError, isAuthError, normalizeError } from './errors';
export { queryKeys } from './query-keys';
export * as tokenStorage from './token-storage';

export * from './types';

export {
  initiatePhoneAuth,
  verifyPhoneAuth,
  resendCode,
  refreshToken,
} from './endpoints/auth';
export { getMe, updateMe } from './endpoints/accounts';
export { getCityFeed, type CityFeedParams } from './endpoints/feed';
