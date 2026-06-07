import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_BASE_URL, AUTH_PATHS, REQUEST_TIMEOUT_MS } from './config';
import { normalizeError } from './errors';
import {
  clearTokens,
  getAccessTokenSync,
  getRefreshTokenSync,
  setTokens,
} from './token-storage';
import type { RefreshTokenResponse } from './types';

/** Internal flag so a request is only retried once after a refresh. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Shared axios instance. All endpoint modules import this; components never
 * touch it directly (they go through TanStack Query hooks — see CLAUDE.md).
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// --- Auth-failure hook -------------------------------------------------------
// The client is React-agnostic. AuthProvider registers a callback here so that
// when a refresh ultimately fails we can drop the user to the auth screen
// without the client importing navigation/React.

type AuthFailureHandler = () => void;
let onAuthFailure: AuthFailureHandler | null = null;

export function setOnAuthFailure(handler: AuthFailureHandler | null): void {
  onAuthFailure = handler;
}

// --- Request interceptor: attach Bearer when we hold a token -----------------
// Attached unconditionally when present so both "optional auth" (owner-enriched
// public endpoints) and protected endpoints work.

apiClient.interceptors.request.use((config) => {
  const token = getAccessTokenSync();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// --- Response interceptor: 401 refresh-and-retry -----------------------------
// Single in-flight refresh; concurrent 401s queue and replay once it resolves.

let isRefreshing = false;
let pendingQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function flushQueue(error: unknown, token: string | null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
}

function isAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  return Object.values(AUTH_PATHS).some((path) => url.includes(path));
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    const canRefresh =
      error.response?.status === 401 &&
      originalRequest != null &&
      !originalRequest._retry &&
      !isAuthPath(originalRequest.url) &&
      getRefreshTokenSync() != null;

    if (!canRefresh) {
      return Promise.reject(normalizeError(error));
    }

    // A refresh is already running — wait for it, then replay this request.
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest!.headers.set('Authorization', `Bearer ${token}`);
          originalRequest!._retry = true;
          return apiClient(originalRequest!);
        })
        .catch((err) => Promise.reject(normalizeError(err)));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refresh = getRefreshTokenSync();
      // Bare axios (not the instance) to avoid interceptor recursion.
      const { data } = await axios.post<RefreshTokenResponse>(
        `${API_BASE_URL}${AUTH_PATHS.refresh}`,
        { refresh },
        { timeout: REQUEST_TIMEOUT_MS },
      );

      await setTokens({ access: data.access });
      flushQueue(null, data.access);

      originalRequest.headers.set('Authorization', `Bearer ${data.access}`);
      return await apiClient(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      await clearTokens();
      onAuthFailure?.();
      return Promise.reject(normalizeError(refreshError));
    } finally {
      isRefreshing = false;
    }
  },
);
