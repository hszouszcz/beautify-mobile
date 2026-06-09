# Backend spec — Find tab availability filters

**Status:** proposed — needed to make the Find filter UI functional
**Owner:** mobile (consumer) → DRF (implementer)
**Last updated:** 2026-06-09

## Why

The Find tab (mobile) now ships a filter sheet where a user picks an **availability
window** — a date range and/or a time-of-day range — and expects the salon list to
narrow to salons that have a free slot in that window. The mobile client already
sends the params (see "Contract" below); today the backend ignores them, so the
filters are inert. This document specifies the server work to make them real.

Search-by-text (salon / service name) is handled client-side for now over the
already-loaded page. A server `q` param is included here as the proper long-term
replacement (§ Optional, phase 2).

## Constraints that shaped this

- The salon list endpoint (`GET /salons/salons/`) currently accepts only `city`
  and `page`. There is **no** existing way to ask "which salons are free on date D
  between A and B" — `GET /bookings/availability/` requires a specific
  `salon + service + staff + single date` and returns slots, not salons.
- Anonymous browsing is core — these endpoints must stay **public** (no auth).
- The list is paginated (DRF envelope: `count / next / previous / results`).
  Filtering must happen **before** pagination, server-side.

## Contract (what mobile already sends)

Extend `GET /salons/salons/` with optional query params:

| Param | Type | Example | Meaning |
|---|---|---|---|
| `available_from_date` | `date` (YYYY-MM-DD) | `2026-06-12` | First day of the window (salon-local calendar day). |
| `available_to_date` | `date` (YYYY-MM-DD) | `2026-06-15` | Last day, **inclusive**. Equals `from_date` for a single day. |
| `available_from_time` | `time` (HH:mm) | `09:00` | Earliest wall-clock start, applied to **every** day in the range. |
| `available_to_time` | `time` (HH:mm) | `13:00` | Latest wall-clock start, inclusive-exclusive per your slot model. |

Rules:

- **All four are independent and optional.** Any combination is valid:
  - date range only → "free any time those days"
  - time range only → "free in this time window, any upcoming day" (use a sensible
    default horizon, e.g. next 30 days)
  - both → time window on each day of the date range
  - none → current behavior (unfiltered city list)
- Times are **wall-clock in the salon's own timezone** (`salon.timezone`), not UTC.
  A `10:00` filter means 10:00 local to each salon. Do not convert client-side.
- `available_to_time` with no `available_from_time` (and vice versa) is valid —
  treat the missing bound as the salon's open/close edge.
- Invalid combos (`to_date < from_date`, `to_time <= from_time`) → `400` with the
  standard `{ "error": ... }` shape. The mobile UI prevents these, but validate
  defensively.

## Semantics — what "available" means

A salon **matches** the filter if it has **at least one bookable slot** whose start
falls inside the requested window, for **any** of its services/staff. Concretely,
for each day `d` in `[from_date, to_date]`:

1. Skip days the salon is closed (business hours + `schedule-exceptions`).
2. Compute the salon's free slots for `d` (reuse the existing slot-generation /
   availability logic that powers `GET /bookings/availability/`, aggregated across
   the salon's active staff + services rather than a single tuple).
3. Keep the salon if any free slot's local start time is within
   `[from_time, to_time]` (or within open hours if a time bound is absent).

A salon needs only **one** qualifying slot to be included — this is a discovery
filter, not a booking guarantee.

### Performance note

Computing real availability across all salons in a city per request can be heavy.
Acceptable strategies, in rough order of preference:

1. **Precomputed availability index** — a materialized table of
   `(salon, date, has_slot, earliest_slot, latest_slot)` refreshed on
   booking/hours changes; the filter becomes a cheap indexed query.
2. **Denormalized per-day open/free flags** cached in Redis with short TTL.
3. On-the-fly computation with an enforced `page_size` cap and DB-level prefilter
   by business hours before the expensive slot pass.

Pick whatever fits the booking model; the mobile contract doesn't care which.

## Response

**Unchanged shape** — same paginated `Salon` envelope as today. No new fields are
required for the filter to work. (Optional niceties below.)

```json
{
  "count": 12,
  "next": "https://api.beautify.local/api/salons/salons/?city=Warsaw&available_from_date=2026-06-12&page=2",
  "previous": null,
  "results": [ { /* …existing Salon object… */ } ]
}
```

Optional, if cheap to include (improves the card without an extra round-trip):

| Field | Type | Use |
|---|---|---|
| `next_available_date` | `date \| null` | Show "Najbliższy termin: 12 cze" on the card. |
| `next_available_time` | `time \| null` | Pair with the date for a richer hint. |

## Optional — phase 2: server-side text search (`q`)

Replaces the client-side substring filter (which only sees the loaded page).

| Param | Type | Meaning |
|---|---|---|
| `q` | `string` | Case-insensitive match against salon `name`, `address`, and the names of the salon's active **services**. Service match is the key bit — the salon list carries no services, so the client cannot do this well across pages. |

Combine with `AND` against the availability filters and `city`.

## Optional — phase 3: distance-from-address (geo radius)

Product idea ("range from address"). Salons already carry `latitude` / `longitude`.

| Param | Type | Meaning |
|---|---|---|
| `lat` | `float` | Origin latitude (user location or geocoded address). |
| `lng` | `float` | Origin longitude. |
| `radius_km` | `float` | Max distance; filter + sort by distance ascending. |

Mirror the existing `nearby_feed` geo approach for consistency. Optionally return a
`distance_km` field per salon.

## Acceptance checklist

- [ ] `GET /salons/salons/` accepts the four `available_*` params, public, paginated.
- [ ] Filtering is server-side and pre-pagination; `count` reflects the filtered set.
- [ ] Times interpreted in each salon's timezone; closed days/exceptions respected.
- [ ] Invalid ranges → `400`; absent/partial params behave per the rules above.
- [ ] No params → byte-identical to current behavior (no regression).
- [ ] (phase 2) `q` matches salon name/address/service names.
- [ ] OpenAPI schema + Swagger updated.

## Mobile wiring already in place (for reference)

- Params built in `hooks/use-salons.ts` → `api/endpoints/salons.ts` (`getSalons`),
  serialized as the snake_case names above.
- Filter state in `providers/find-filters-provider.tsx` (`SalonFilters`).
- UI: `app/find/filters.tsx` + `components/find/{date-range-strip,time-range-field,filter-trigger}.tsx`.
- The query key includes the filters, so results refetch automatically when the
  endpoint starts honoring them — **no further client changes needed**.
