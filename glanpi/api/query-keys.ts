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
  salons: {
    all: () => ['salons'] as const,
    city: (city: string) => ['salons', 'city', city] as const,
    // City list + availability filters (date/time range). Serialized filters are
    // part of the key so the list refetches when filters change.
    list: (city: string, filters: Record<string, string | undefined>) =>
      ['salons', 'city', city, 'filters', filters] as const,
    // The backend ignores `?salon=`, so services are fetched once and filtered
    // client-side per card — hence a single shared key, not one per salon.
    services: () => ['salons', 'services', 'all'] as const,
    detail: (id: number | string) => ['salons', 'detail', id] as const,
    staff: (id: number | string) => ['salons', 'staff', id] as const,
    hours: (id: number | string) => ['salons', 'hours', id] as const,
  },
  posts: {
    detail: (id: string) => ['posts', 'detail', id] as const,
    booking: (id: string) => ['posts', 'booking', id] as const,
  },
  bookings: {
    mine: () => ['bookings', 'mine'] as const,
    availability: (
      salon: number | string,
      service: number | string,
      staff: number | string,
      date: string,
    ) => ['bookings', 'availability', salon, service, staff, date] as const,
  },
} as const;
