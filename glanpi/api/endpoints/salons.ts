import { apiClient } from '../client';
import type { Paginated, Salon, SalonService } from '../types';

/**
 * Salon browsing endpoints (Find tab). PUBLIC — anonymous browsing is core to
 * the product, so these work without auth (a Bearer is still attached when held).
 *
 * The salon list returns neither images nor services inline, and the services
 * endpoint ignores its `?salon=` filter, so the Find card is assembled from the
 * salon list (name/rating/address) plus a single shared services fetch that each
 * card filters client-side. Work images have no real per-salon source yet — the
 * card uses dev placeholders (see `use-salon-thumbnails`).
 */

export interface SalonsParams {
  city: string;
  page?: number;
}

/** City-scoped salon list. Tolerates both a DRF page envelope and a bare array. */
export async function getSalons({
  city,
  page = 1,
}: SalonsParams): Promise<Paginated<Salon>> {
  const { data } = await apiClient.get<Salon[] | Paginated<Salon>>('/salons/salons/', {
    params: { city, page },
  });
  // Tolerate a non-paginated (bare array) response so `results` is never
  // undefined — otherwise the infinite-query flatten silently yields nothing.
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data };
  }
  return data;
}

/**
 * Every salon's services in one call. The `?salon=` filter is ignored by the
 * backend, so we fetch the full list once (shared query key) and let each card
 * filter by its `salon` id. Tolerates a bare array or a page envelope.
 */
export async function getAllServices(): Promise<SalonService[]> {
  const { data } = await apiClient.get<SalonService[] | Paginated<SalonService>>(
    '/salons/services/',
  );
  return Array.isArray(data) ? data : data.results;
}
