export const CITIES: string[] = ['Warsaw', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań'];

export type LatLng = { latitude: number; longitude: number };

/**
 * City centres — used to centre the Find map before any salon markers load (and
 * as a fallback when salons have no coordinates). Keyed by the same strings as
 * `CITIES` / the city context.
 */
export const CITY_COORDS: Record<string, LatLng> = {
  Warsaw: { latitude: 52.2297, longitude: 21.0122 },
  Kraków: { latitude: 50.0647, longitude: 19.945 },
  Wrocław: { latitude: 51.1079, longitude: 17.0385 },
  Gdańsk: { latitude: 54.352, longitude: 18.6466 },
  Poznań: { latitude: 52.4064, longitude: 16.9252 },
};

/** Default map zoom span (~city-wide) for the initial region. */
export const CITY_REGION_DELTA = { latitudeDelta: 0.12, longitudeDelta: 0.12 };
