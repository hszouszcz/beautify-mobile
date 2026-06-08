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

/** `city_feed` extends the page envelope with the echoed query context. */
export interface CityFeedResponse extends Paginated<FeedPost> {
  city: string;
  post_type: PostType | null;
  total_posts: number;
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
