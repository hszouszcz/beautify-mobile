import { apiClient } from '../client';
import type { CityFeedResponse, PostType } from '../types';

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
  const { data } = await apiClient.get<CityFeedResponse>('/feed/posts/city_feed/', {
    params: { city, post_type: postType, page },
  });
  return data;
}
