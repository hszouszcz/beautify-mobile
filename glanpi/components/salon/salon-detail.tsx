import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { GDivider } from '@/components/ui';
import { useAppTheme } from '@/theme';

import { ServiceListRow } from './service-list-row';

export type SalonServiceRow = {
  id: string;
  name: string;
  duration: string;
  price: string | null;
};

export type SalonDetailProps = {
  services: SalonServiceRow[];
  onPressService: (id: string) => void;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType | React.ReactElement | null;
  sharedScrollOffset?: SharedValue<number>;
};

/**
 * Salon Detail body as a single LegendList (per project rule — never
 * ScrollView): `data` is the services array, with gallery/identity/about in the
 * header slot and staff/hours in the footer slot. Service rows divider-separated.
 */
export function SalonDetail({
  services,
  onPressService,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  sharedScrollOffset,
}: SalonDetailProps) {
  const { app } = useAppTheme();

  return (
    <AnimatedLegendList
      data={services}
      keyExtractor={(item) => item.id}
      estimatedItemSize={64}
      recycleItems
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={{ paddingBottom: app.spacing.xxl }}
      sharedValues={
        sharedScrollOffset != null ? { scrollOffset: sharedScrollOffset } : undefined
      }
      ItemSeparatorComponent={() => (
        <View style={{ paddingHorizontal: app.spacing.lg }}>
          <GDivider />
        </View>
      )}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: app.spacing.lg }}>
          <ServiceListRow
            name={item.name}
            duration={item.duration}
            price={item.price}
            onPress={() => onPressService(item.id)}
          />
        </View>
      )}
    />
  );
}
