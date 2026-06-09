import { useMemo } from 'react';

import type { Salon } from '@/api';
import { SalonCard, type SalonCardService } from '@/components/salon';
import { useSalonServices } from '@/hooks/use-salon-services';
import { useSalonThumbnails } from '@/hooks/use-salon-thumbnails';
import { formatPrice } from '@/lib/format';

export type SalonListItemProps = {
  salon: Salon;
  onPress: (salon: Salon) => void;
};

/**
 * One Find-list card. The salon list endpoint carries no services/images, so we
 * enrich each rendered salon: `useSalonServices` (shared fetch, filtered to this
 * salon) for the price rows, and `useSalonThumbnails` for the work collage. Maps
 * the result into the shared `SalonCard`. `avg_rating` arrives as a decimal
 * string and is parsed before display.
 */
export function SalonListItem({ salon, onPress }: SalonListItemProps) {
  const { data: services } = useSalonServices(salon.id);
  const imageUrls = useSalonThumbnails(salon.id);

  const cardServices = useMemo<SalonCardService[]>(
    () =>
      (services ?? []).map((s) => ({
        id: String(s.id),
        name: s.name,
        price: formatPrice(s.price_display),
      })),
    [services],
  );

  return (
    <SalonCard
      name={salon.name}
      imageUrls={imageUrls}
      rating={Number(salon.avg_rating) || 0}
      reviewCount={salon.review_count}
      meta={salon.address}
      services={cardServices}
      onPress={() => onPress(salon)}
    />
  );
}
