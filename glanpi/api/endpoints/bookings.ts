import { apiClient } from '../client';
import type {
  AvailabilityResponse,
  Booking,
  CreateAnonymousBookingRequest,
  CreateBookingRequest,
  CreateBookingResponse,
  Paginated,
  SlotHold,
} from '../types';

/**
 * Booking endpoints. Availability and holds are PUBLIC (anonymous browsing →
 * book is core to the product); `createBooking` / `getMyBookings` are PROTECTED
 * (the request interceptor attaches the Bearer once a session exists). The
 * authenticated create-by-`start_time` is the primary path (design D1); the
 * anonymous create is the documented fallback.
 */

export interface AvailabilityParams {
  salon: number | string;
  service: number | string;
  staff: number | string;
  date: string; // YYYY-MM-DD
}

/** Contiguous atomic slot options for one (salon, service, staff, date). PUBLIC. */
export async function getAvailability(
  p: AvailabilityParams,
): Promise<AvailabilityResponse> {
  const { data } = await apiClient.get<AvailabilityResponse>('/bookings/availability/', {
    params: { salon: p.salon, service: p.service, staff: p.staff, date: p.date },
  });
  return data;
}

/** Temporarily hold a set of slots (5-min TTL). PUBLIC. */
export async function createSlotHold(
  slotIds: (number | string)[],
): Promise<SlotHold> {
  const { data } = await apiClient.post<SlotHold>('/bookings/holds/', {
    slot_ids: slotIds,
  });
  return data;
}

/** Create a booking for the authenticated user. PROTECTED. */
export async function createBooking(
  body: CreateBookingRequest,
): Promise<CreateBookingResponse> {
  const { data } = await apiClient.post<CreateBookingResponse>('/bookings/', body);
  return data;
}

/** Anonymous fallback create (email/phone). PUBLIC. */
export async function createAnonymousBooking(
  body: CreateAnonymousBookingRequest,
): Promise<CreateBookingResponse> {
  const { data } = await apiClient.post<CreateBookingResponse>(
    '/bookings/create_anonymous/',
    body,
  );
  return data;
}

/** Current user's bookings (Calendar handoff). PROTECTED. Array-or-envelope. */
export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[] | Paginated<Booking>>('/bookings/');
  return Array.isArray(data) ? data : data.results;
}

/** Cancel an anonymous booking by token (respects cancellation policy). PUBLIC. */
export async function cancelAnonymousBooking(token: string): Promise<void> {
  await apiClient.post('/bookings/cancel_anonymous/', { token });
}
