import { apiClient } from '../client';
import type { CityFeedResponse, FeedPost, PostBooking, PostType } from '../types';

/**
 * Empty-city variant: DRF wraps the flat `city_feed` body in its pagination
 * envelope, nesting it (as a single object, not a list) under `results`.
 */
type WrappedCityFeed = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CityFeedResponse;
};

/**
 * Feed endpoints. PUBLIC — work without auth (anonymous browsing is core to the
 * product). A Bearer is still sent when present so authenticated users get any
 * owner-enriched data.
 */

export interface CityFeedParams {
  city: string;
  postType?: PostType;
  page?: number;
}

/** City-scoped feed (the main mobile feed endpoint), paginated. */
export async function getCityFeed({
  city,
  postType,
  page = 1,
}: CityFeedParams): Promise<CityFeedResponse> {
  const { data } = await apiClient.get<CityFeedResponse | WrappedCityFeed>(
    '/feed/posts/city_feed/',
    { params: { city, post_type: postType, page } },
  );
  // The endpoint returns the flat shape ({ …, results: FeedPost[] }) when the
  // city has posts, but DRF wraps it in a pagination envelope
  // ({ count, next, previous, results: { …, results: [] } }) when it's empty.
  // Unwrap the envelope so callers always receive `results: FeedPost[]`.
  return Array.isArray((data as CityFeedResponse).results)
    ? (data as CityFeedResponse)
    : (data as WrappedCityFeed).results;
}

/** Full post detail (PUBLIC). The GET also tracks the view server-side. */
export async function getPost(id: string): Promise<FeedPost> {
  const { data } = await apiClient.get<FeedPost>(`/feed/posts/${id}/`);
  return data;
}

/** Tap-to-book payload: salon + services + staff + featured service (PUBLIC). */
export async function getPostBooking(id: string): Promise<PostBooking> {
  const { data } = await apiClient.get<PostBooking>(`/feed/posts/${id}/salon_booking/`);
  return data;
}
