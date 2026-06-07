import { QueryClient } from '@tanstack/react-query';

/**
 * App-wide TanStack Query client. Defaults tuned for a mobile feed: data stays
 * fresh briefly, retries once, and refetch-on-mount is left on for freshness.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
