import { useQuery } from '@tanstack/react-query';

import {
  getPost,
  queryKeys,
  type ApiError,
  type CityFeedResponse,
  type FeedPost,
} from '@/api';
import type { InfiniteData } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Full post detail. Seeds `initialData` from whatever is already in the feed
 * cache (the post is usually warm from Explore), so the hero paints instantly
 * and the GET only refreshes view-count/etc. in the background.
 */
export function usePost(id: string) {
  const queryClient = useQueryClient();

  return useQuery<FeedPost, ApiError>({
    queryKey: queryKeys.posts.detail(id),
    queryFn: () => getPost(id),
    enabled: id.length > 0,
    initialData: () => findInFeedCache(queryClient, id),
    staleTime: 60_000,
  });
}

/** Scan every cached city-feed page for a post with this id. */
function findInFeedCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
): FeedPost | undefined {
  const entries = queryClient.getQueriesData<InfiniteData<CityFeedResponse>>({
    queryKey: queryKeys.feed.all(),
  });
  for (const [, data] of entries) {
    const found = data?.pages.flatMap((p) => p.results).find((post) => post.id === id);
    if (found) return found;
  }
  return undefined;
}
