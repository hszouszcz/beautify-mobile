/**
 * Shared DTOs for the API layer. Only the types needed by the core-infra
 * examples (auth, accounts, feed) live here; new domains add their own as they
 * are wired up against the same `endpoints/*` + `hooks/*` template.
 */

export type UserRole = 'customer' | 'staff' | 'owner';

export interface User {
  id: string;
  phone: string;
  phone_verified: boolean;
  email: string | null;
  first_name: string;
  last_name: string;
  role: UserRole;
}

/** JWT pair issued by phone verification. Refresh is long-lived (months). */
export interface AuthTokens {
  access: string;
  refresh: string;
}

/** Standard DRF page envelope. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type PostType = 'hair' | 'makeup' | 'nails' | 'skin';

export interface FeedPost {
  id: string;
  salon: { id: number; name: string; city: string };
  author: { id: string; display_name: string } | null;
  title: string;
  description: string;
  post_type: PostType;
  image_url: string;
  thumbnail_url: string | null;
  featured_service: { id: string; name: string } | null;
  likes_count: number;
  views_count: number;
  is_promoted: boolean;
  status: string;
  published_at: string;
}

/**
 * `city_feed` response. This endpoint does NOT use DRF pagination — when the
 * city has posts it returns a flat, custom shape with the (server-capped) result
 * set inline and no `count/next/previous`. `next` is therefore absent today; it
 * is kept optional so the infinite-query stop condition stays robust if the
 * backend adds paging later. (When a city has no salons the endpoint instead
 * returns a DRF-wrapped envelope nesting this object under `results` —
 * `getCityFeed` normalizes that back to this flat shape.)
 */
export interface CityFeedResponse {
  city: string;
  post_type: PostType | null;
  total_posts: number;
  results: FeedPost[];
  next?: string | null;
}

// --- Salon browsing (Find tab) ---

/** A salon as returned by `GET /salons/salons/`. No images/services inline. */
export interface Salon {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string | null;
  website: string | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  /** Serialized as a decimal string by DRF (e.g. "4.5"); parse before display. */
  avg_rating: string;
  review_count: number;
  is_active: boolean;
}

/**
 * A bookable service. `price_display` is a decimal string (e.g. "180.00").
 * NOTE: `GET /salons/services/?salon=` ignores the filter and returns every
 * salon's services, so callers must filter by `salon` client-side.
 */
export interface SalonService {
  id: number;
  salon: number;
  name: string;
  duration_minutes: number;
  price_display: string | null;
}

// --- Staff & business hours (Salon Detail + booking) ---

/**
 * A salon staff member. `GET /salons/staff/?salon=` may ignore its filter (like
 * `/services/`), so callers filter by `salon` client-side. Id types are mixed
 * int/uuid across the dev backend — keep loose and pass through verbatim
 * (plan §3.1 ID-type note).
 */
export interface Staff {
  id: number | string;
  salon: number | string;
  display_name: string;
  services?: (number | string)[];
  is_active: boolean;
}

export interface BusinessHours {
  id: number | string;
  salon: number | string;
  day_of_week: number; // 0=Mon … 6=Sun
  day_name: string;
  open_time: string | null; // "09:00:00"
  close_time: string | null;
  is_closed: boolean;
}

// --- Tap-to-book payload: GET /feed/posts/{id}/salon_booking/ ---

export interface PostBookingSalon {
  id: number | string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string | null;
  timezone: string;
}

/** A service as returned inside `salon_booking` — `services[]` here lack price (G3). */
export interface BookingServiceLite {
  id: number | string;
  name: string;
  description?: string;
  duration_minutes: number;
  price_display?: string | null; // present only on `featured_service`
}

export interface PostBooking {
  salon: PostBookingSalon;
  recommended_staff: { id: number | string; name: string; bio?: string } | null;
  services: BookingServiceLite[];
  staff_members: { id: number | string; display_name: string }[];
  featured_service: BookingServiceLite | null;
  ui_hints?: {
    post_type: PostType;
    has_featured_service: boolean;
    booking_message?: string;
    /**
     * Services the post suggests when there's no explicit `featured_service`.
     * The first entry is the preselect fallback for the booking flow.
     */
    recommended_services?: BookingServiceLite[];
  };
}

// --- Availability: GET /bookings/availability/ ---

export interface SlotOption {
  slot_ids: (number | string)[];
  start_datetime: string; // ISO 8601 UTC
  end_datetime: string;
  display: { start_time: string; end_time: string }; // salon-local "09:00:00"
}

export interface AvailabilityResponse {
  salon: string;
  service: string;
  staff: string;
  date: string;
  slot_options: SlotOption[];
  total_options: number;
}

// --- Slot holds (5-min TTL) ---

export interface SlotHold {
  hold_id: string;
  expires_at: string; // ISO 8601 UTC
}

// --- Bookings ---

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

/** Embedded salon/service/staff objects vary by endpoint — kept intentionally loose. */
export interface Booking {
  id: number | string;
  salon: { id: number | string; name: string; address?: string; timezone?: string };
  service: {
    id: number | string;
    name: string;
    duration_minutes?: number;
    price_display?: string | null;
  };
  staff: { id: number | string; display_name?: string; name?: string } | null;
  start_time: string; // ISO UTC
  end_time: string;
  status: BookingStatus;
  customer_name?: string;
  created_at: string;
}

export interface CreateBookingRequest {
  salon: number | string;
  service: number | string;
  staff: number | string;
  start_time: string; // = SlotOption.start_datetime
}

export interface CreateAnonymousBookingRequest extends CreateBookingRequest {
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
}

export interface CreateBookingResponse {
  booking: Booking;
  booking_token?: string;
}

// --- Auth request/response shapes ---

export interface InitiatePhoneAuthRequest {
  phone: string;
}

export interface InitiatePhoneAuthResponse {
  message: string;
  phone_number_hint: string;
  resend_wait_seconds: number;
}

export interface VerifyPhoneAuthRequest {
  phone: string;
  code: string;
}

export interface VerifyPhoneAuthResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
  created: boolean;
}

export interface RefreshTokenResponse {
  access: string;
}
