import { useMemo } from 'react';

import { USE_MOCK_IMAGES, mockImageUrl } from '@/components/feed';

/** How many work thumbnails the card collage shows. */
const THUMB_COUNT = 4;

/**
 * Work-image thumbnails for a salon card collage.
 *
 * There is no real per-salon image source yet: the salon list carries no images,
 * the feed's `?salon=` filter is ignored by the backend, and the seeded posts
 * expose Unsplash *page* URLs (not loadable images) — which is why Explore mocks
 * media in `__DEV__`. We follow the same convention here: deterministic
 * placeholders seeded per salon in dev, and an empty collage in production until
 * a real per-salon posts endpoint exists.
 */
export function useSalonThumbnails(salonId: number): string[] {
  return useMemo(() => {
    if (!USE_MOCK_IMAGES) return [];
    return Array.from({ length: THUMB_COUNT }, (_, i) =>
      mockImageUrl(`salon-${salonId}-${i}`, 1),
    );
  }, [salonId]);
}
