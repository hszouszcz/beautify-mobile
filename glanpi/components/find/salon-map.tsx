import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import type { Salon } from '@/api';
import { CITY_COORDS, CITY_REGION_DELTA } from '@/constants/cities';
import { useAppTheme } from '@/theme';

export type SalonMapProps = {
  salons: Salon[];
  city: string;
  onPressSalon: (salon: Salon) => void;
};

/**
 * Map view of the Find results: brown pins for each salon with coordinates,
 * over the selected city. Re-keyed by city so switching city recenters the map
 * (avoids controlled-region jank while the user pans). iOS uses Apple Maps,
 * Android uses Google Maps — see app.json `android.config.googleMaps`.
 */
export function SalonMap({ salons, city, onPressSalon }: SalonMapProps) {
  const { app } = useAppTheme();

  const initialRegion = useMemo<Region>(() => {
    const centre = CITY_COORDS[city] ?? CITY_COORDS.Warsaw;
    return { ...centre, ...CITY_REGION_DELTA };
  }, [city]);

  const pins = useMemo(
    () => salons.filter((s) => s.latitude != null && s.longitude != null),
    [salons],
  );

  return (
    <MapView key={city} style={styles.map} initialRegion={initialRegion}>
      {pins.map((salon) => (
        <Marker
          key={salon.id}
          coordinate={{ latitude: salon.latitude!, longitude: salon.longitude! }}
          title={salon.name}
          description={salon.address}
          pinColor={app.colors.accent}
          onCalloutPress={() => onPressSalon(salon)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
