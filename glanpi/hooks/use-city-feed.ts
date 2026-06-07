import { useInfiniteQuery } from '@tanstack/react-query';

import {
  getCityFeed,
  queryKeys,
  type ApiError,
  type CityFeedResponse,
  type PostType,
} from '@/api';

/**
 * City-scoped feed (PUBLIC), paginated for infinite scroll. The DRF envelope's
 * `next` URL signals there's another page; we advance the page number while it
 * is non-null.
 */
export function useCityFeed(city: string, postType?: PostType) {
  return useInfiniteQuery<CityFeedResponse, ApiError>({
    queryKey: queryKeys.feed.city(city, postType),
    queryFn: ({ pageParam }) =>
      getCityFeed({ city, postType, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
    enabled: city.length > 0,
  });
}
