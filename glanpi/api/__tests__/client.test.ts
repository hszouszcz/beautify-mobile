/**
 * Tests the axios instance's interceptors against a mock adapter (no network):
 * Bearer attachment, the single-flight 401 refresh-and-retry, and the
 * refresh-failure → logout path. These are the highest-risk lines in the API
 * layer (a bug here silently logs everyone out or loops).
 */

import axios, { AxiosError, type AxiosAdapter } from 'axios';

import { apiClient, setOnAuthFailure } from '@/api/client';
import { tokenStorage } from '@/api';

function ok(config: Parameters<AxiosAdapter>[0]) {
  return Promise.resolve({
    data: { ok: true, sentAuth: config.headers?.Authorization },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
}

function unauthorized(config: Parameters<AxiosAdapter>[0]) {
  return Promise.reject(
    new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, {}, {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config,
      data: { detail: 'token expired' },
    } as never),
  );
}

describe('apiClient interceptors', () => {
  afterEach(async () => {
    jest.restoreAllMocks();
    setOnAuthFailure(null);
    await tokenStorage.clearTokens();
  });

  it('attaches the Bearer token when one is held', async () => {
    await tokenStorage.setTokens({ access: 'tok', refresh: 'r1' });
    apiClient.defaults.adapter = ok as AxiosAdapter;

    const res = await apiClient.get('/protected/');
    expect(res.data.sentAuth).toBe('Bearer tok');
  });

  it('refreshes once on 401 and replays the original request', async () => {
    await tokenStorage.setTokens({ access: 'old', refresh: 'r1' });
    const refreshSpy = jest
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: { access: 'new' } });

    let calls = 0;
    apiClient.defaults.adapter = ((config) => {
      calls += 1;
      return calls === 1 ? unauthorized(config) : ok(config);
    }) as AxiosAdapter;

    const res = await apiClient.get('/protected/');

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(res.data.sentAuth).toBe('Bearer new'); // retried with the fresh token
    expect(tokenStorage.getAccessTokenSync()).toBe('new');
  });

  it('logs out when the refresh itself fails', async () => {
    await tokenStorage.setTokens({ access: 'old', refresh: 'r1' });
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('refresh dead'));
    const onFailure = jest.fn();
    setOnAuthFailure(onFailure);

    apiClient.defaults.adapter = unauthorized as AxiosAdapter;

    await expect(apiClient.get('/protected/')).rejects.toBeDefined();
    expect(onFailure).toHaveBeenCalled();
    expect(tokenStorage.getAccessTokenSync()).toBeNull();
  });

  it('does not attempt a refresh for auth-path 401s', async () => {
    await tokenStorage.setTokens({ access: 'old', refresh: 'r1' });
    const refreshSpy = jest.spyOn(axios, 'post');
    apiClient.defaults.adapter = unauthorized as AxiosAdapter;

    await expect(
      apiClient.post('/accounts/auth/phone/verify/', { code: '0000' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
