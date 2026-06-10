import { AxiosError, type AxiosResponse } from 'axios';

import { ApiError, isApiError, isAuthError, normalizeError } from '@/api/errors';

/** Build an AxiosError carrying a given response body/status. */
function axiosErrorWith(status: number, data: unknown, code?: string): AxiosError {
  const response = { status, data, statusText: '', headers: {}, config: {} as never } as AxiosResponse;
  return new AxiosError('Request failed', code, undefined, {}, response);
}

describe('normalizeError', () => {
  it('returns an existing ApiError unchanged', () => {
    const original = new ApiError({ status: 400, message: 'x' });
    expect(normalizeError(original)).toBe(original);
  });

  it('flags network failures (no response)', () => {
    const err = new AxiosError('Network Error', 'ECONNABORTED');
    const api = normalizeError(err);
    expect(api.isNetwork).toBe(true);
    expect(api.status).toBe(0);
    expect(api.code).toBe('ECONNABORTED');
  });

  it('prefers the backend `error`, then `message`, then `detail`', () => {
    expect(normalizeError(axiosErrorWith(400, { error: 'boom' })).message).toBe('boom');
    expect(normalizeError(axiosErrorWith(400, { message: 'msg' })).message).toBe('msg');
    expect(normalizeError(axiosErrorWith(400, { detail: 'd' })).message).toBe('d');
  });

  it('extracts DRF field errors, ignoring reserved keys', () => {
    const api = normalizeError(
      axiosErrorWith(400, {
        detail: 'Validation failed',
        email: ['Enter a valid email.'],
        phone: 'Required',
      }),
    );
    expect(api.fieldErrors).toEqual({
      email: ['Enter a valid email.'],
      phone: ['Required'],
    });
    expect(api.detail).toBe('Validation failed');
  });

  it('reads retryAfterSeconds from a 429 body', () => {
    const api = normalizeError(axiosErrorWith(429, { resend_wait_seconds: 30 }));
    expect(api.status).toBe(429);
    expect(api.retryAfterSeconds).toBe(30);
  });

  it('falls back to a generic message when the body is empty', () => {
    expect(normalizeError(axiosErrorWith(500, {})).message).toBe(
      'Request failed with status 500',
    );
  });

  it('wraps non-axios throwables', () => {
    expect(normalizeError(new Error('weird')).message).toBe('weird');
    expect(normalizeError('string error').message).toBe('Unknown error');
  });
});

describe('type guards', () => {
  it('isApiError narrows ApiError instances', () => {
    expect(isApiError(new ApiError({ status: 1, message: 'm' }))).toBe(true);
    expect(isApiError(new Error('x'))).toBe(false);
  });

  it('isAuthError is true only for 401 ApiErrors', () => {
    expect(isAuthError(new ApiError({ status: 401, message: 'm' }))).toBe(true);
    expect(isAuthError(new ApiError({ status: 403, message: 'm' }))).toBe(false);
    expect(isAuthError(new Error('x'))).toBe(false);
  });
});
