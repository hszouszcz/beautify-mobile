import { StyleSheet, View } from 'react-native';

import { GCard, GRatingBadge, GText } from '@/components/ui';
import { useAppTheme } from '@/theme';

import { ImageCollage } from './image-collage';
import { ServicePriceRow } from './service-price-row';

export type SalonCardService = {
  id: string;
  name: string;
  price?: string | null;
};

export type SalonCardProps = {
  name: string;
  imageUrls: string[];
  rating: number;
  reviewCount?: number;
  /** Pre-formatted meta line, e.g. "3.9 km · 25 Rosewood Street Camden, London". */
  meta?: string;
  services: SalonCardService[];
  /** Max service rows to show. Default: 3. */
  maxServices?: number;
  onPress?: () => void;
  testID?: string;
};

/**
 * The Find-list salon card: work collage + name + rating + meta line + a few
 * service/price rows. Whole card taps through to the salon (tap-to-book).
 */
export function SalonCard({
  name,
  imageUrls,
  rating,
  reviewCount,
  meta,
  services,
  maxServices = 3,
  onPress,
  testID,
}: SalonCardProps) {
  const { app } = useAppTheme();

  return (
    <GCard onPress={onPress} padding="md" testID={testID}>
      <ImageCollage uris={imageUrls} />

      <View style={[styles.header, { marginTop: app.spacing.md }]}>
        <GText variant="titleSmall" style={styles.name} numberOfLines={1}>
          {name}
        </GText>
        <GRatingBadge rating={rating} reviewCount={reviewCount} />
      </View>

      {meta && (
        <GText variant="caption" color="faint" numberOfLines={1}>
          {meta}
        </GText>
      )}

      <View style={[styles.services, { marginTop: app.spacing.sm }]}>
        {services.slice(0, maxServices).map((service) => (
          <ServicePriceRow key={service.id} name={service.name} price={service.price} />
        ))}
      </View>
    </GCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: { flexShrink: 1 },
  services: { gap: 2 },
});
