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

/**
 * DEV ONLY: the API isn't serving real media yet, so swap in deterministic
 * placeholder photos (picsum.photos, seeded per post → stable across renders,
 * sized to the tile's aspect ratio) so the grid / infinite scroll can be
 * exercised. Remove this and the call site below once real images are available.
 */
export const USE_MOCK_IMAGES = __DEV__;

export function mockImageUrl(seed: string, aspectRatio: number): string {
  const width = 400;
  const height = Math.round(width / aspectRatio);
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

/**
 * Maps API feed posts to mosaic tile view models. Prefers the lighter thumbnail.
 * De-duplicates by `id` first: page-number pagination can return the same post
 * across pages when the backend list shifts, and duplicate ids become duplicate
 * list keys — which makes LegendList drop/collapse cells (content "disappears").
 */
export function toFeedTiles(posts: FeedPost[]): FeedTileModel[] {
  const seen = new Set<string>();
  const unique = posts.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });

  return unique.map((post, i) => {
    const slot = MOSAIC_TEMPLATE[i % MOSAIC_TEMPLATE.length];
    return {
      id: post.id,
      imageUrl: USE_MOCK_IMAGES
        ? mockImageUrl(post.id, slot.aspectRatio)
        : post.thumbnail_url ?? post.image_url,
      aspectRatio: slot.aspectRatio,
      span: slot.span,
    };
  });
}
