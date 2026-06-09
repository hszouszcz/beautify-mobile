/**
 * Thin analytics seam (PRD §3 funnel). The tool is still TBD (PostHog vs
 * Firebase — PRD §11), so this is a no-op that logs in `__DEV__`. Keeping every
 * call site behind this one module means swapping in the real SDK later is a
 * single-file change.
 */

export type AnalyticsEvent =
  | 'post_open'
  | 'salon_open'
  | 'booking_start'
  | 'service_select'
  | 'slot_select'
  | 'phone_submit'
  | 'booking_created'
  | 'booking_confirmed';

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props ?? {});
  }
}
