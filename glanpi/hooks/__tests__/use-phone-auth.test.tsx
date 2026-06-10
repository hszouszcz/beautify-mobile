import { act, waitFor } from '@testing-library/react-native';

import { initiatePhoneAuth, tokenStorage, verifyPhoneAuth } from '@/api';
import { useAuth } from '@/hooks/use-auth';
import {
  useInitiatePhoneAuth,
  useVerifyPhoneAuth,
} from '@/hooks/use-phone-auth';
import { makeUser, renderHookWithProviders } from '@/test/utils';

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  initiatePhoneAuth: jest.fn(),
  verifyPhoneAuth: jest.fn(),
}));

const mockInitiate = initiatePhoneAuth as jest.MockedFunction<typeof initiatePhoneAuth>;
const mockVerify = verifyPhoneAuth as jest.MockedFunction<typeof verifyPhoneAuth>;
const { ApiError } = jest.requireActual('@/api') as typeof import('@/api');

describe('useInitiatePhoneAuth', () => {
  beforeEach(() => mockInitiate.mockReset());

  it('returns the SMS hint + resend window on success', async () => {
    mockInitiate.mockResolvedValue({
      message: 'ok',
      phone_number_hint: '••• ••• 800',
      resend_wait_seconds: 30,
    });
    const { result } = renderHookWithProviders(() => useInitiatePhoneAuth());

    let data;
    await act(async () => {
      data = await result.current.mutateAsync({ phone: '+48600700800' });
    });

    expect(data).toMatchObject({ resend_wait_seconds: 30 });
    expect(mockInitiate).toHaveBeenCalledWith({ phone: '+48600700800' });
  });

  it('exposes retryAfterSeconds when rate-limited (429)', async () => {
    mockInitiate.mockRejectedValue(
      new ApiError({ status: 429, message: 'slow down', retryAfterSeconds: 30 }),
    );
    const { result } = renderHookWithProviders(() => useInitiatePhoneAuth());

    await act(async () => {
      await expect(
        result.current.mutateAsync({ phone: '+48600700800' }),
      ).rejects.toBeInstanceOf(ApiError);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.retryAfterSeconds).toBe(30);
  });
});

describe('useVerifyPhoneAuth', () => {
  beforeEach(async () => {
    mockVerify.mockReset();
    await tokenStorage.clearTokens();
  });

  it('persists the session via signIn on success', async () => {
    const user = makeUser();
    mockVerify.mockResolvedValue({
      message: 'ok',
      user,
      access: 'acc',
      refresh: 'ref',
      is_new_user: true,
    });

    const { result } = renderHookWithProviders(() => ({
      verify: useVerifyPhoneAuth(),
      auth: useAuth(),
    }));
    await waitFor(() => expect(result.current.auth.status).not.toBe('loading'));

    await act(async () => {
      await result.current.verify.mutateAsync({ phone: '+48600700800', code: '1111' });
    });

    await waitFor(() => expect(result.current.auth.status).toBe('authenticated'));
    expect(result.current.auth.user).toEqual(user);
    expect(tokenStorage.getAccessTokenSync()).toBe('acc');
  });

  it('surfaces a wrong/expired code error without signing in', async () => {
    mockVerify.mockRejectedValue(new ApiError({ status: 400, message: 'bad code' }));

    const { result } = renderHookWithProviders(() => ({
      verify: useVerifyPhoneAuth(),
      auth: useAuth(),
    }));
    await waitFor(() => expect(result.current.auth.status).not.toBe('loading'));

    await act(async () => {
      await expect(
        result.current.verify.mutateAsync({ phone: '+48600700800', code: '0000' }),
      ).rejects.toBeInstanceOf(ApiError);
    });

    expect(result.current.auth.status).toBe('unauthenticated');
  });
});
