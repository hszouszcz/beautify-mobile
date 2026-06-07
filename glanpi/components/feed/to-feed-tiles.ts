import type { FeedPost } from '@/api';

/**
 * View model for a single mosaic cell. The grid is column-based (`numColumns=2`);
 * `span` lets a tile occupy both columns (a full-width "hero"), and `aspectRatio`
 * varies the height so the grid reads as a Pinterest-style mosaic.
 */
export type FeedTileModel = {
  id: string;
  imageUrl: string;
  aspectRatio: number;
  span: number;
};

/**
 * Deterministic repeating mosaic template (period 6). Slot index = `i % 6`.
 * Tune here to reshape the mosaic — the grid reads `span`/`aspectRatio` per tile.
 */
export const MOSAIC_TEMPLATE: readonly { span: number; aspectRatio: number }[] = [
  { span: 2, aspectRatio: 1.6 }, // full-width hero (landscape)
  { span: 1, aspectRatio: 0.8 }, // tall
  { span: 1, aspectRatio: 1.0 }, // square
  { span: 1, aspectRatio: 1.0 }, // square
  { span: 1, aspectRatio: 0.8 }, // tall
  { span: 2, aspectRatio: 1.7 }, // full-width hero (landscape)
];

/** Maps API feed posts to mosaic tile view models. Prefers the lighter thumbnail. */
export function toFeedTiles(posts: FeedPost[]): FeedTileModel[] {
  return posts.map((post, i) => {
    const slot = MOSAIC_TEMPLATE[i % MOSAIC_TEMPLATE.length];
    return {
      id: post.id,
      imageUrl: post.thumbnail_url ?? post.image_url,
      aspectRatio: slot.aspectRatio,
      span: slot.span,
    };
  });
}
