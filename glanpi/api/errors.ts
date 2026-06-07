import axios from 'axios';

/**
 * Normalized API error. Every failure surfaced to hooks/UI is an `ApiError`,
 * so callers never need to branch on raw axios internals.
 */
export class ApiError extends Error {
  /** HTTP status, or 0 for network/timeout failures. */
  readonly status: number;
  /** Backend `detail` string, when present. */
  readonly detail?: string;
  /** DRF field-level validation errors: `{ field: [messages] }`. */
  readonly fieldErrors?: Record<string, string[]>;
  /** True when the request never reached the server (offline, timeout). */
  readonly isNetwork: boolean;
  /** Axios error code (e.g. `ECONNABORTED`), when available. */
  readonly code?: string;
  /** For 429s, seconds to wait before retrying (from the response body). */
  readonly retryAfterSeconds?: number;

  constructor(init: {
    status: number;
    message: string;
    detail?: string;
    fieldErrors?: Record<string, string[]>;
    isNetwork?: boolean;
    code?: string;
    retryAfterSeconds?: number;
  }) {
    super(init.message);
    this.name = 'ApiError';
    this.status = init.status;
    this.detail = init.detail;
    this.fieldErrors = init.fieldErrors;
    this.isNetwork = init.isNetwork ?? false;
    this.code = init.code;
    this.retryAfterSeconds = init.retryAfterSeconds;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function isAuthError(err: unknown): boolean {
  return isApiError(err) && err.status === 401;
}

/** Pull DRF field errors out of a response body, ignoring the known scalars. */
function extractFieldErrors(
  data: Record<string, unknown>,
): Record<string, string[]> | undefined {
  const reserved = new Set(['error', 'detail', 'message']);
  const fields: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(data)) {
    if (reserved.has(key)) continue;
    if (Array.isArray(value)) {
      fields[key] = value.map(String);
    } else if (typeof value === 'string') {
      fields[key] = [value];
    }
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
}

/**
 * Map any thrown value into an `ApiError`. Handles the backend's
 * `{ error, detail }` shape, DRF field maps, and network/timeout failures.
 */
export function normalizeError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (axios.isAxiosError(err)) {
    const { response, code, message } = err;

    if (!response) {
      return new ApiError({
        status: 0,
        message: message || 'Network request failed',
        isNetwork: true,
        code,
      });
    }

    const data = (response.data ?? {}) as Record<string, unknown>;
    const detail = typeof data.detail === 'string' ? data.detail : undefined;
    const backendMessage =
      (typeof data.error === 'string' && data.error) ||
      (typeof data.message === 'string' && data.message) ||
      detail ||
      `Request failed with status ${response.status}`;

    const retryAfterSeconds =
      typeof data.resend_wait_seconds === 'number'
        ? data.resend_wait_seconds
        : undefined;

    return new ApiError({
      status: response.status,
      message: backendMessage,
      detail,
      fieldErrors: extractFieldErrors(data),
      code,
      retryAfterSeconds,
    });
  }

  return new ApiError({
    status: 0,
    message: err instanceof Error ? err.message : 'Unknown error',
  });
}
