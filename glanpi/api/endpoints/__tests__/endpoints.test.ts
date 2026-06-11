/**
 * Endpoint-layer tests. The axios instance is mocked, so these assert the bits
 * with real logic: DRF envelope-vs-array tolerance, client-side `?salon=`
 * filtering, the empty-city feed unwrap, and correct params/paths.
 */

import { apiClient } from '@/api/client';
import {
  getAllServices,
  getBusinessHours,
  getSalon,
  getSalons,
  getStaff,
} from '@/api/endpoints/salons';
import { getCityFeed, getPost, getPostBooking } from '@/api/endpoints/feed';
import {
  cancelAnonymousBooking,
  createAnonymousBooking,
  createBooking,
  createSlotHold,
  getAvailability,
  getMyBookings,
} from '@/api/endpoints/bookings';
import {
  initiatePhoneAuth,
  refreshToken,
  resendCode,
  verifyPhoneAuth,
} from '@/api/endpoints/auth';
import { getMe, updateMe } from '@/api/endpoints/accounts';

jest.mock('@/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;
const patch = (apiClient as unknown as { patch: jest.Mock }).patch;

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  patch.mockReset();
});

describe('getSalons', () => {
  it('passes through a DRF page envelope', async () => {
    const envelope = { count: 1, next: null, previous: null, results: [{ id: 1 }] };
    get.mockResolvedValue({ data: envelope });
    await expect(getSalons({ city: 'Warsaw', page: 2 })).resolves.toEqual(envelope);
    expect(get).toHaveBeenCalledWith(
      '/salons/salons/',
      { params: expect.objectContaining({ city: 'Warsaw', page: 2 }) },
    );
  });

  it('wraps a bare array into a page envelope', async () => {
    get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
    const res = await getSalons({ city: 'Warsaw' });
    expect(res).toEqual({ count: 2, next: null, previous: null, results: [{ id: 1 }, { id: 2 }] });
  });
});

describe('getStaff / getBusinessHours', () => {
  it('filters staff to the requested salon client-side', async () => {
    get.mockResolvedValue({
      data: [
        { id: 1, salon: 7, display_name: 'A', is_active: true },
        { id: 2, salon: 9, display_name: 'B', is_active: true },
      ],
    });
    const res = await getStaff(7);
    expect(res.map((s) => s.id)).toEqual([1]);
  });

  it('filters business hours to the requested salon (envelope form)', async () => {
    get.mockResolvedValue({
      data: { count: 2, next: null, previous: null, results: [
        { id: 1, salon: 7, day_of_week: 0 },
        { id: 2, salon: 8, day_of_week: 0 },
      ] },
    });
    const res = await getBusinessHours('7');
    expect(res).toHaveLength(1);
    expect(res[0].salon).toBe(7);
  });
});

describe('getAllServices / getSalon', () => {
  it('unwraps a services page envelope', async () => {
    get.mockResolvedValue({ data: { count: 1, next: null, previous: null, results: [{ id: 5 }] } });
    await expect(getAllServices()).resolves.toEqual([{ id: 5 }]);
  });

  it('fetches a single salon by id', async () => {
    get.mockResolvedValue({ data: { id: 3, name: 'X' } });
    await getSalon(3);
    expect(get).toHaveBeenCalledWith('/salons/salons/3/');
  });
});

describe('getCityFeed', () => {
  it('returns the flat shape when the city has posts', async () => {
    const flat = { city: 'Warsaw', post_type: null, total_posts: 1, results: [{ id: 'p1' }] };
    get.mockResolvedValue({ data: flat });
    await expect(getCityFeed({ city: 'Warsaw' })).resolves.toEqual(flat);
  });

  it('unwraps the DRF envelope for an empty city', async () => {
    const inner = { city: 'Warsaw', post_type: null, total_posts: 0, results: [] };
    get.mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: inner },
    });
    await expect(getCityFeed({ city: 'Warsaw' })).resolves.toEqual(inner);
  });
});

describe('bookings + simple passthroughs', () => {
  it('getAvailability forwards the tuple as params', async () => {
    get.mockResolvedValue({ data: { slot_options: [] } });
    await getAvailability({ salon: 1, service: 2, staff: 3, date: '2026-06-12' });
    expect(get).toHaveBeenCalledWith('/bookings/availability/', {
      params: { salon: 1, service: 2, staff: 3, date: '2026-06-12' },
    });
  });

  it('createBooking posts the body and returns data', async () => {
    post.mockResolvedValue({ data: { booking: { id: 1 } } });
    const res = await createBooking({ salon: 1, service: 2, staff: 3, start_time: 't' });
    expect(res).toEqual({ booking: { id: 1 } });
    expect(post).toHaveBeenCalledWith('/bookings/', {
      salon: 1, service: 2, staff: 3, start_time: 't',
    });
  });

  it('getMyBookings tolerates a bare array', async () => {
    get.mockResolvedValue({ data: [{ id: 1 }] });
    await expect(getMyBookings()).resolves.toEqual([{ id: 1 }]);
  });

  it('getPost / getMe / getPostBooking delegate to the client', async () => {
    get.mockResolvedValue({ data: { id: 'p1' } });
    await expect(getPost('p1')).resolves.toEqual({ id: 'p1' });

    get.mockResolvedValue({ data: { id: 'u1' } });
    await expect(getMe()).resolves.toEqual({ id: 'u1' });

    get.mockResolvedValue({ data: { salon: { id: 1 } } });
    await getPostBooking('p1');
    expect(get).toHaveBeenLastCalledWith('/feed/posts/p1/salon_booking/');
  });

  it('auth + slot-hold + anonymous booking posts forward their bodies', async () => {
    post.mockResolvedValue({ data: { ok: true } });

    await initiatePhoneAuth({ phone: '+48600700800' });
    expect(post).toHaveBeenLastCalledWith(expect.stringContaining('initiate'), {
      phone: '+48600700800',
    });

    await verifyPhoneAuth({ phone: '+48600700800', code: '1111' });
    expect(post).toHaveBeenLastCalledWith(expect.stringContaining('verify'), {
      phone: '+48600700800',
      verification_code: '1111',
    });

    await resendCode({ phone: '+48600700800' });
    expect(post).toHaveBeenLastCalledWith(expect.stringContaining('resend'), {
      phone: '+48600700800',
    });

    post.mockResolvedValue({ data: { access: 'a' } });
    await refreshToken('r1');
    expect(post).toHaveBeenLastCalledWith(expect.stringContaining('refresh'), {
      refresh: 'r1',
    });

    post.mockResolvedValue({ data: { hold_id: 'h1' } });
    await createSlotHold([1, 2]);
    expect(post).toHaveBeenLastCalledWith('/bookings/holds/', { slot_ids: [1, 2] });

    post.mockResolvedValue({ data: { booking: { id: 1 } } });
    await createAnonymousBooking({
      salon: 1, service: 2, staff: 3, start_time: 't',
      customer_name: 'Ada', customer_email: 'ada@test.com', customer_phone: '+48600700800',
    });
    expect(post).toHaveBeenLastCalledWith(
      '/bookings/create_anonymous/',
      expect.objectContaining({ customer_name: 'Ada' }),
    );

    post.mockResolvedValue({ data: {} });
    await cancelAnonymousBooking('tok-1');
    expect(post).toHaveBeenLastCalledWith('/bookings/cancel_anonymous/', { token: 'tok-1' });
  });

  it('updateMe PATCHes the profile fields', async () => {
    patch.mockResolvedValue({ data: { id: 'u1', first_name: 'Ada' } });
    const res = await updateMe({ first_name: 'Ada' });
    expect(res).toEqual({ id: 'u1', first_name: 'Ada' });
    expect(patch).toHaveBeenCalledWith('/accounts/me/', { first_name: 'Ada' });
  });
});
