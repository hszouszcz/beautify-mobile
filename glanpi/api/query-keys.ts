import type { PostType } from './types';

/**
 * Central TanStack Query key factory. One source of truth so invalidation and
 * cache reads never drift apart. New domains extend this object.
 */
export const queryKeys = {
  me: () => ['me'] as const,
  feed: {
    all: () => ['feed'] as const,
    city: (city: string, postType?: PostType) =>
      ['feed', 'city', city, postType ?? null] as const,
  },
} as const;
