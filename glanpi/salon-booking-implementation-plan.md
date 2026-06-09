# Salon Detail & Service Booking — Implementation Plan

**Phase 2 deliverable** · Author: Architecture · Date: 2026-06-08
**Implements:** [salon-booking-ux-design.md](salon-booking-ux-design.md) (Phase 1) against [prd.md](prd.md) §5.2–5.5, §12
**Backend contract:** [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md), [../MOBILE_QUICK_REFERENCE.md](../MOBILE_QUICK_REFERENCE.md)

> This plan slots the feature into the existing layered architecture
> (`api/endpoints` → `api/types` → `hooks` → `components` → `app` routes) and
> respects every rule in [CLAUDE.md](CLAUDE.md): New Architecture, Reanimated-only,
> styles via `StyleSheet.create`, **LegendList** for lists, **TanStack Query** for
> all server state, i18n keys for all copy, `@/` imports. It reuses the patterns
> already shipped in Explore/Find so the new code reads like the old code.

---

## 1. Scope

**In scope (this feature):**
- Post Detail screen ([app/post/[id].tsx](app/post/[id].tsx) — replace placeholder)
- Salon Detail screen ([app/salon/[id].tsx](app/salon/[id].tsx) — replace placeholder)
- Booking flow modal: Service → Schedule (staff+date+time) → {Details → SMS | Review} → Confirmation
- The data layer (endpoints, types, query keys, hooks) for salon detail, staff,
  business hours, post-booking payload, availability, slot holds, booking create.
- 4 new UI primitives + booking-specific components.
- i18n keys (PL), analytics funnel hooks, error/edge handling.

**Out of scope (separate work, noted as handoffs):**
- Calendar / "My bookings" list + cancel/reschedule UI (PRD §5.2.11) — Confirmation
  only deep-links to it. `use-my-bookings` is included as the seam.
- All salon-side management (onboarding, services, posts).
- Reviews list, save/favorite, waitlist, push registration UI (PRD §6 / Phase 1.5).

---

## 2. Architecture at a glance

```
app/post/[id].tsx ─┐                         ┌─ hooks/use-post.ts ───────────── GET /feed/posts/{id}/
app/salon/[id].tsx ┤  screens (route)        ├─ hooks/use-post-booking.ts ───── GET /feed/posts/{id}/salon_booking/
app/booking/* ─────┘                         ├─ hooks/use-salon.ts ──────────── GET /salons/salons/{id}/
       │ consume                             ├─ hooks/use-salon-staff.ts ────── GET /salons/staff/?salon=
       ▼                                     ├─ hooks/use-business-hours.ts ─── GET /salons/business-hours/?salon=
components/{post,salon,booking}/*  ◀─────────┤  hooks/  (TanStack Query)
components/ui/* (G* kit + 4 new)             ├─ hooks/use-availability.ts ───── GET /bookings/availability/
       │ read tokens                         ├─ hooks/use-slot-hold.ts ──────── POST /bookings/holds/
       ▼                                     ├─ hooks/use-create-booking.ts ─── POST /bookings/
theme/ (tokens + paper-theme)                ├─ hooks/use-update-profile.ts ── PATCH /accounts/me/
                                             └─ hooks/use-my-bookings.ts ───── GET /bookings/  (handoff)
                                                      │ call
                                                      ▼
                                             api/endpoints/{feed,salons,bookings,accounts}.ts
                                                      │ via apiClient (axios) + normalizeError
                                                      ▼
                                             api/types.ts · api/query-keys.ts · api/index.ts
```

Booking-flow cross-step state lives in a **`BookingDraftProvider`** mounted in
`app/booking/_layout.tsx` (mirrors the existing [city-provider](providers/city-provider.tsx)
/ [auth-provider](providers/auth-provider.tsx) pattern). Route params carry only the
entry point (`salonId`, optional `serviceId`); everything chosen mid-flow lives in
the draft context.

---

## 3. Data layer

### 3.1 Types — extend [api/types.ts](api/types.ts)

> **ID-type note.** The existing types use `number` for `Salon.id`,
> `SalonService.id`/`.salon`, and `FeedPost.salon.id`, but `string` for
> `FeedPost.id` / `featured_service.id`. The API docs say `uuid` everywhere — the
> dev backend evidently returns mixed types. **Follow the established types** and
> introduce new ids as the backend actually returns them; verify `Staff.id` and the
> booking foreign-key fields against a live `/salons/staff/` and `/bookings/availability/`
> response during M1, exactly as the codebase already pragmatically adapts (bare
> array vs envelope, ignored `?salon=`). The booking request bodies below send ids
> as received from those responses (don't coerce).

```ts
// --- Staff & hours ---
export interface Staff {
  id: number | string;          // verify against GET /salons/staff/
  salon: number | string;
  display_name: string;
  services: (number | string)[];
  is_active: boolean;
}

export interface BusinessHours {
  id: number | string;
  salon: number | string;
  day_of_week: number;          // 0=Mon … 6=Sun
  day_name: string;
  open_time: string | null;     // "09:00:00"
  close_time: string | null;
  is_closed: boolean;
}

// --- Tap-to-book payload: GET /feed/posts/{id}/salon_booking/ ---
export interface PostBookingSalon {
  id: number | string;
  name: string; address: string; city: string;
  phone: string; email: string | null; timezone: string;
}
export interface BookingServiceLite {        // services[] here lack price (G3)
  id: number | string;
  name: string;
  description?: string;
  duration_minutes: number;
  price_display?: string | null;             // present only on featured_service
}
export interface PostBooking {
  salon: PostBookingSalon;
  recommended_staff: { id: number | string; name: string; bio?: string } | null;
  services: BookingServiceLite[];
  staff_members: { id: number | string; display_name: string }[];
  featured_service: BookingServiceLite | null;
  ui_hints?: { post_type: PostType; has_featured_service: boolean; booking_message?: string };
}

// --- Availability: GET /bookings/availability/ ---
export interface SlotOption {
  slot_ids: (number | string)[];
  start_datetime: string;       // ISO 8601 UTC
  end_datetime: string;
  display: { start_time: string; end_time: string }; // salon-local "09:00:00"
}
export interface AvailabilityResponse {
  salon: string; service: string; staff: string; date: string;
  slot_options: SlotOption[];
  total_options: number;
}

// --- Holds ---
export interface SlotHold { hold_id: string; expires_at: string; }

// --- Booking (embedded salon/service/staff objects vary; keep loose) ---
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export interface Booking {
  id: number | string;
  salon: { id: number | string; name: string; address?: string; timezone?: string };
  service: { id: number | string; name: string; duration_minutes?: number; price_display?: string | null };
  staff: { id: number | string; display_name?: string; name?: string } | null;
  start_time: string;           // ISO UTC
  end_time: string;
  status: BookingStatus;
  customer_name?: string;
  created_at: string;
}
export interface CreateBookingRequest {
  salon: number | string; service: number | string; staff: number | string;
  start_time: string;           // = SlotOption.start_datetime
}
export interface CreateAnonymousBookingRequest extends CreateBookingRequest {
  customer_name: string; customer_email?: string; customer_phone: string;
}
export interface CreateBookingResponse { booking: Booking; booking_token?: string; }
```

### 3.2 Endpoints

**Extend [api/endpoints/salons.ts](api/endpoints/salons.ts):**
```ts
export async function getSalon(id: number | string): Promise<Salon>            // GET /salons/salons/{id}/
export async function getStaff(salonId): Promise<Staff[]>                       // GET /salons/staff/?salon= (filter client-side; ?salon may be ignored like services)
export async function getBusinessHours(salonId): Promise<BusinessHours[]>       // GET /salons/business-hours/?salon=
```
Reuse the existing array-or-envelope tolerance helper already used by `getSalons`.

**Extend [api/endpoints/feed.ts](api/endpoints/feed.ts):**
```ts
export async function getPost(id: string): Promise<FeedPost>                    // GET /feed/posts/{id}/
export async function getPostBooking(id: string): Promise<PostBooking>          // GET /feed/posts/{id}/salon_booking/
```

**New [api/endpoints/bookings.ts](api/endpoints/bookings.ts):**
```ts
export interface AvailabilityParams { salon; service; staff; date: string; }    // date = YYYY-MM-DD
export async function getAvailability(p: AvailabilityParams): Promise<AvailabilityResponse>
export async function createSlotHold(slotIds): Promise<SlotHold>                // POST /bookings/holds/
export async function createBooking(b: CreateBookingRequest): Promise<CreateBookingResponse>
export async function createAnonymousBooking(b: CreateAnonymousBookingRequest): Promise<CreateBookingResponse>
export async function getMyBookings(): Promise<Booking[]>                        // GET /bookings/  (array-or-envelope)
export async function cancelAnonymousBooking(token: string): Promise<void>       // POST /bookings/cancel_anonymous/ (handoff)
```
All are public except `createBooking` / `getMyBookings` (Bearer attached
automatically by the [client interceptor](api/client.ts) when a session exists).
`normalizeError` already maps `{error, detail}` + `retryAfterSeconds` + field maps,
so hooks get a clean `ApiError`.

**Extend [api/endpoints/accounts.ts](api/endpoints/accounts.ts):** `updateMe` already
exists (PATCH name) — reuse as-is.

**Re-export** all new functions/types from [api/index.ts](api/index.ts).

### 3.3 Query keys — extend [api/query-keys.ts](api/query-keys.ts)
```ts
salons: {
  …existing,
  detail: (id) => ['salons', 'detail', id] as const,
  staff:  (id) => ['salons', 'staff', id] as const,
  hours:  (id) => ['salons', 'hours', id] as const,
},
posts: {
  detail:  (id) => ['posts', 'detail', id] as const,
  booking: (id) => ['posts', 'booking', id] as const,
},
bookings: {
  mine: () => ['bookings', 'mine'] as const,
  availability: (salon, service, staff, date) =>
    ['bookings', 'availability', salon, service, staff, date] as const,
},
```

### 3.4 Hooks (in `hooks/`, one file each — mirror [use-salon-services.ts](hooks/use-salon-services.ts) / [use-city-feed.ts](hooks/use-city-feed.ts))

| Hook | Type | Notes |
|---|---|---|
| `useSalon(id)` | `useQuery` | salon identity; `staleTime` 5m. **Also used by Post Detail** to enrich the salon strip's rating + warm the cache for the post→salon hop (§8.6) |
| `useSalonStaff(salonId)` | `useQuery` | filter client-side by `salon` if `?salon=` ignored (like services) |
| `useBusinessHours(salonId)` | `useQuery` | for closed-days + open-now |
| `usePost(id)` | `useQuery` | seed `initialData` from feed cache if present |
| `usePostBooking(id)` | `useQuery` | the tap-to-book payload; drives the flow's service/staff lists |
| `useAvailability({salon,service,staff,date})` | `useQuery` | `enabled` only when all four present; key per tuple; `staleTime` ~30s |
| `useSlotHold()` | `useMutation` | returns `{hold_id, expires_at}` |
| `useCreateBooking()` | `useMutation` | `POST /bookings/`; on success invalidate `bookings.mine` |
| `useCreateAnonymousBooking()` | `useMutation` | fallback path (D1) |
| `useUpdateProfile()` | `useMutation` | wraps `updateMe`; invalidate `me` |
| `useMyBookings()` | `useQuery` | Calendar handoff; `enabled` when authenticated |

Reuse existing `useInitiatePhoneAuth` / `useVerifyPhoneAuth`
([hooks/use-phone-auth.ts](hooks/use-phone-auth.ts)) for the SMS sub-flow and
`useAuth` for session status.

---

## 4. New UI primitives — `components/ui/`

Follow the G* convention (thin Paper wrapper, token-driven, exported from
[components/ui/index.ts](components/ui/index.ts)). Specs in design doc §8.

| File | Component | Built on |
|---|---|---|
| `g-text-field.tsx` | `GTextField` | Paper `TextInput` (outlined, 56pt, error state) |
| `g-otp-input.tsx` | `GOtpInput` | RN `TextInput`s (hidden master input + boxes), one-time-code autofill |
| `g-bottom-bar.tsx` | `GBottomBar` | `View` + safe-area inset + `elevation.raised` |
| `g-step-progress.tsx` | `GStepProgress` | `View` segments, `accent`/`backgroundStrong` |

`GBottomBar` and `GStepProgress` are pure layout/token components (no Paper).

---

## 5. Feature components

### 5.1 `components/post/`
- `post-detail-view.tsx` — composes hero + sheet (the screen body).
- `post-salon-strip.tsx` — pressable salon row (`GCard`, avatar + name + `GRatingBadge` + city + chevron). Rating comes from `useSalon` enrichment (degrades to name+city while it loads); press prefetches the salon screen's queries then pushes `/salon/[id]` (§8.6).
- `featured-service-card.tsx` — accent-tinted card; emits the preselected service.

### 5.2 `components/salon/` (extend the existing folder)
- `salon-detail.tsx` — the `LegendList` composition (services = data, header/footer slots). Reuses existing `ServicePriceRow` styling ideas.
- `salon-hero.tsx` — horizontal image pager + floating back/share (`GIconButton`).
- `salon-identity.tsx` — name + `GRatingBadge` + address + action buttons + open-now pill.
- `salon-about.tsx` — clamped description + expander.
- `service-list-row.tsx` — bookable service row (name / duration / price / ⊕), pressable.
- `staff-strip.tsx` — horizontal avatars (`GAvatar`) + names.
- `business-hours-list.tsx` — day rows, today emphasized, closed labeled.
- Reuse existing [image-collage.tsx](components/salon/image-collage.tsx) if a strip (not pager) is chosen for v1.

### 5.3 `components/booking/`
- `booking-modal-header.tsx` — ✕ + title + `GStepProgress` (one per step).
- `service-option-row.tsx` — radio row + "Ze zdjęcia" chip.
- `staff-selector.tsx` — horizontal avatar selector (hidden if ≤1 staff).
- `date-strip.tsx` + `date-pill.tsx` — horizontal `LegendList` of dates; closed-day disabling.
- `time-slot-grid.tsx` + `time-slot-pill.tsx` — `LegendList` `numColumns={3}` of slots; loading/empty/error region states.
- `booking-summary-card.tsx` — shared by Review + Confirmation (`GCard`: salon, service, staff, date+time, price, address).
- `hold-countdown-banner.tsx` — live mm:ss from `expires_at`.

All carry **no hardcoded copy** (screens pass i18n strings) — same discipline as
`FeedGrid` / `SalonList`.

---

## 6. Routing & navigation

### 6.1 Register routes — [app/_layout.tsx](app/_layout.tsx)
Add to the root `<Stack>`:
```tsx
<Stack.Screen name="salon/[id]" options={{ headerShown: false }} />
<Stack.Screen name="booking" options={{ presentation: 'modal', headerShown: false }} />
```
(`post/[id]` is already declared; switch its header off since the screen owns a
floating back button.)

### 6.2 Booking group — `app/booking/_layout.tsx`
```tsx
export default function BookingLayout() {
  return (
    <BookingDraftProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
        <Stack.Screen name="service" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="details" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="review" />
        <Stack.Screen name="confirmation" options={{ gestureEnabled: false }} />
      </Stack>
    </BookingDraftProvider>
  );
}
```

### 6.3 Entry & navigation calls
- Open from Post Detail: `router.push({ pathname: '/booking/service', params: { salonId, postId, serviceId? } })`.
- Open from Salon Detail (CTA): `…params: { salonId }`; from a service row: `…params: { salonId, serviceId }`.
- Within flow: `router.push('/booking/schedule')`, etc. The draft context holds
  selections; params are only the entry seed.
- Confirmation terminates history: `router.dismissAll()` then route to Calendar, or
  `router.replace('/booking/confirmation')` so back can't re-enter mid-flow.
- "Zobacz w kalendarzu": `router.dismissAll()` + `router.push('/(tabs)/calendar')`.

---

## 7. Booking draft state — `providers/booking-draft-provider.tsx`

```ts
type BookingDraft = {
  salonId: number | string;
  postId?: string;
  timezone?: string;                 // from salon_booking, for display
  service?: BookingServiceLite;      // chosen service (price merged in — G3)
  staffId?: number | string;
  staffName?: string;
  date?: string;                     // YYYY-MM-DD
  slot?: SlotOption;                 // chosen option (start_datetime → start_time)
  hold?: SlotHold;                   // if created
  name?: { first: string; last: string };
  phone?: string;                    // E.164
  createdBooking?: Booking;          // set after POST; Confirmation reads this
};
// Provider exposes { draft, set(partial), reset() }.
```
- Seeded on `service` screen mount from route params + `usePostBooking`/`useSalon`.
- One mutable object, `set(partial)` merges. Scoped to the modal — unmounts (and
  resets) when the flow closes. This avoids threading complex objects (the `SlotOption`)
  through route params.

---

## 8. Key flows in code

### 8.1 Service price merge (G3)
`salon_booking.services` lack `price_display`. In the `service` screen, merge the
booking-payload services with `/salons/services/` (which has price) by id, or call
`usePostBooking` for the canonical service list + the shared services query for
prices. Format with the existing `Math.round(Number(price_display)) + ' zł'` helper
(lift it from [salon-list-item.tsx](components/find/salon-list-item.tsx) into
`lib/format.ts` and reuse in both places).

### 8.2 Availability fetch (Schedule)
`useAvailability` keyed on `(salon, service, staff, date)`, `enabled` only when all
four exist. Changing staff or date re-keys → React Query handles the refetch + cache.
Pills render `slot_options`; selecting stores the whole `SlotOption` in the draft.

### 8.3 Closed days & open-now
Build a `Set<dayOfWeek>` of closed days from `useBusinessHours`; `date-strip`
disables matching dates. Open-now compares "now in salon `timezone`" to today's
`open_time`/`close_time`. Use `Intl.DateTimeFormat('pl-PL', { timeZone, … })` +
`Date` — **no new date dependency needed** (slot times come pre-formatted in
`display.*`; the strip only formats weekday/day numbers). Put helpers in
`lib/datetime.ts`.

### 8.4 The create-booking orchestration (design §5.7)
On Schedule **Dalej**:
1. (recommended) `useSlotHold().mutate(slot.slot_ids)` → store `hold` + start countdown.
2. Branch on `useAuth().status`:
   - authenticated + `/me` has name → `router.push('/booking/review')`.
   - else → `router.push('/booking/details')`.
3. **Review** CTA → `useCreateBooking().mutate({ salon, service, staff, start_time: slot.start_datetime })`.
4. **Verify** success → if `created || !me.first_name` call `useUpdateProfile` with the
   draft name, then `useCreateBooking` (authenticated — the JWT is now set by `signIn`).
5. On create success → store `createdBooking`, `router.replace('/booking/confirmation')`.
6. On create failure → map status: slot-taken (400/409) ⇒ toast + `router.back()` to
   Schedule + invalidate the availability key; limit reached ⇒ inline explain; network
   ⇒ retry. Never navigate to Confirmation on failure.

> The authenticated create-by-`start_time` is the primary path (D1). If a backend
> hold↔auth association is confirmed, `create_anonymous_by_hold` can replace it; until
> then, hold is advisory and the create-failure handler is the real guard (D3).

### 8.5 Phone & OTP
- `lib/phone.ts`: `toE164(national: string): string` (`+48` + 9 digits) + `isValidPL(national)`.
- `GOtpInput` auto-submits at length 4; verify via existing `useVerifyPhoneAuth`.
  Resend uses `resendCode` with the `resend_wait_seconds` countdown; 429 surfaces
  `ApiError.retryAfterSeconds`.

### 8.6 Explore → post → salon composition (enrich + prefetch)
The post→salon hop is wired for a complete salon strip *and* an instant transition:

1. **Enrich the strip.** Post Detail calls `useSalon(salonId)` as soon as the salon
   id is known (from `usePostBooking().data.salon.id`, falling back to the post's
   `salon.id`). The strip shows name + city from post data immediately and the
   `★ avg_rating (review_count)` once `useSalon` resolves — it never blocks the hero
   photo. This call also warms `queryKeys.salons.detail(salonId)`.
2. **Prefetch the rest on press.** Salon Detail additionally needs services/staff/
   hours, which Post Detail doesn't load. On strip press, prefetch them, then navigate:
   ```ts
   const onPressSalon = () => {
     queryClient.prefetchQuery({ queryKey: queryKeys.salons.staff(salonId), queryFn: () => getStaff(salonId) });
     queryClient.prefetchQuery({ queryKey: queryKeys.salons.hours(salonId), queryFn: () => getBusinessHours(salonId) });
     // services are often already cached from Find (shared queryKeys.salons.services())
     router.push(`/salon/${salonId}`);
   };
   ```
   Identity is already warm from step 1, so Salon Detail mounts without a spinner.
3. **One canonical id.** Use `salon_booking.salon.id` for the strip, the prefetch and
   the booking call so post, salon screen and booking flow all agree (keeps the
   int/uuid ambiguity from surfacing mid-flow — see §13.3).

---

## 9. Analytics — `lib/analytics.ts`
A thin `track(event, props?)` no-op (or `console.log` in `__DEV__`) until the tool is
picked (PRD §11). Fire the events in design doc §7 at the listed sites. Keeping it
behind one module means swapping in PostHog/Firebase later is a one-file change.

---

## 10. i18n — extend [i18n/locales/pl.json](i18n/locales/pl.json)
Add namespaces (no hardcoded JSX text — CLAUDE.md rule). Sketch:
```jsonc
"post":    { "featuredService": "Usługa ze zdjęcia", "book": "Zarezerwuj", "more": "więcej", "less": "mniej", "notFound": "Nie znaleziono tej pracy" },
"salon":   { "about": "O salonie", "services": "Usługi", "team": "Zespół", "hours": "Godziny otwarcia",
             "call": "Zadzwoń", "directions": "Trasa", "book": "Zarezerwuj wizytę",
             "openNow": "Otwarte teraz · do {{time}}", "closedNow": "Zamknięte", "closedToday": "Zamknięte dziś",
             "noServices": "Ten salon nie dodał jeszcze usług", "error": "Nie udało się wczytać salonu" },
"booking": { "step": { "service": "Wybierz usługę", "schedule": "Wybierz termin", "details": "Twoje dane",
                       "verify": "Potwierdź numer", "review": "Potwierdź rezerwację" },
             "next": "Dalej", "specialist": "Specjalista", "recommended": "Polecany",
             "slots": { "empty": "Brak wolnych terminów tego dnia", "emptyHint": "Wybierz inny dzień",
                        "error": "Nie udało się wczytać terminów", "morning": "Rano", "afternoon": "Popołudnie", "evening": "Wieczór" },
             "details": { "firstName": "Imię", "lastName": "Nazwisko", "phone": "Numer telefonu",
                          "smsHint": "Wyślemy SMS z kodem na ten numer.", "sendCode": "Wyślij kod" },
             "verify": { "title": "Wpisz kod", "sentTo": "Wysłaliśmy 4-cyfrowy kod na {{hint}}",
                         "resend": "Wyślij ponownie", "wrong": "Nieprawidłowy kod", "expired": "Kod wygasł. Wyślij nowy.",
                         "creating": "Tworzymy rezerwację…" },
             "review": { "bookingAs": "Rezerwujesz jako", "confirm": "Zarezerwuj", "cancelPolicy": "Anulowanie bezpłatne do {{hours}}h przed wizytą." },
             "hold": { "active": "Termin zarezerwowany {{time}}", "expired": "Czas minął — wybierz termin ponownie" },
             "confirmation": { "confirmedTitle": "Rezerwacja potwierdzona!", "pendingTitle": "Prośba wysłana",
                               "pendingBody": "Salon potwierdzi wkrótce — damy znać przez powiadomienie.",
                               "addedToCalendar": "Dodaliśmy to do kalendarza.",
                               "done": "Gotowe", "viewInCalendar": "Zobacz w kalendarzu" },
             "error": { "slotTaken": "Ten termin został właśnie zajęty. Wybierz inny.",
                        "limit": "Masz już maksymalną liczbę aktywnych rezerwacji.",
                        "rateLimit": "Zbyt wiele prób. Spróbuj za {{seconds}}s.", "generic": "Coś poszło nie tak. Spróbuj ponownie." } }
```
(English locale is post-MVP per PRD §6 — PL only now.)

---

## 11. Build order (milestones)

Each milestone is independently shippable/reviewable and leaves the app runnable.

**M0 — Data layer (no UI).** Types (§3.1), endpoints (§3.2), query keys (§3.3),
hooks (§3.4), `lib/{format,datetime,phone,analytics}.ts`. Verify id types + the
`salon_booking`/`availability` shapes against the dev backend (DEBUG number
`+48111111111`/`1111`). *Acceptance:* hooks return typed data in a scratch screen
(reuse the [dev-auth](app/dev-auth.tsx) harness pattern).

**M1 — UI primitives.** `GTextField`, `GOtpInput`, `GBottomBar`, `GStepProgress` +
exports + a quick visual check. *Acceptance:* render in isolation, themed, accessible.

**M2 — Salon Detail.** Replace the placeholder; build `components/salon/*`; wire
`useSalon`/`useSalonStaff`/`useBusinessHours`/services; LegendList composition;
loading/empty/error; bottom CTA + service-row taps push into the (stubbed) booking
route. *Acceptance:* design doc §10.2.

**M3 — Post Detail.** Replace the placeholder; hero + sheet + salon strip + featured
card; CTA opens booking with preselection. Wire the post→salon composition: `useSalon`
strip enrichment + prefetch-on-press (§8.6). *Acceptance:* design doc §10.1, plus
tapping the salon strip lands on a fully-painted Salon Detail with no spinner.

**M4 — Booking: Service + Schedule.** `BookingDraftProvider`, modal layout, step
header/progress; Service select (preselection, price merge); Schedule (staff
selector, date strip with closed-day disabling, slot grid with region states).
*Acceptance:* design doc §10.3; running summary in `GBottomBar` correct.

**M5 — Booking: auth fork + create.** Details (phone/name + validation + initiate),
Verify (OTP + verify + name PATCH + create), Review (authed one-tap create), the
orchestration in §8.4, slot hold + countdown, all error branches. *Acceptance:*
design doc §10.4–10.5 with the DEBUG number.

**M6 — Confirmation + polish.** Confirmation variants (CONFIRMED/PENDING),
summary card, Calendar handoff, analytics events wired, motion polish, a11y pass,
i18n sweep (no stray literals). *Acceptance:* design doc §10 fully; `npm run lint`
clean.

**Handoff (not in this feature):** Calendar "My bookings" consumes `useMyBookings`
+ `cancelAnonymousBooking`/authenticated cancel (the authenticated cancel endpoint
is unconfirmed — see §13).

---

## 12. Testing
- **Manual / device:** the DEBUG test numbers (`+4811111111`…`+4855555555`, codes
  `1111`…`5555`) exercise the full funnel without real SMS (PRD §12). Cover both
  signed-out (new account) and signed-in (returning) paths, plus slot-taken,
  hold-expiry, 429, closed-day, empty-slots.
- **E2E (Maestro):** add flows under the project's Maestro setup — tap tile → book →
  confirm (signed-in fast path), and the SMS path with a DEBUG code. Use `testID`s on
  the bottom-bar CTA, slot pills, and OTP field. (Optimistic-update + adaptive-auth
  patterns per the project's Maestro guidance.)
- **Types:** `tsc`/lint gate; no `any` on API boundaries.

---

## 13. Open questions / backend dependencies (track against PRD §11)
1. **Authenticated cancel endpoint** — only `cancel_anonymous` (token) is documented;
   the authenticated "My bookings" cancel/accept path needs confirmation (PRD §11).
   *Affects the Calendar handoff, not this feature's happy path.*
2. **Hold ↔ authenticated create** — can a slot hold created anonymously be honored by
   `POST /bookings/` (by `start_time`) for the now-authenticated user, or must we use
   `create_anonymous_by_hold`? Decides whether hold is binding or advisory (D3).
3. **ID types** — confirm `Staff.id` and booking FK field types from live responses
   (mixed int/uuid today). Keep request bodies passing ids verbatim.
4. **`staff` "required" in availability** — confirm there's no salon-wide ("any staff")
   availability; if there is, we can offer "Dowolny" (revisits D2).
5. **Slot-taken status code** — confirm the exact code/body when a slot is no longer
   available, to map §8.4 precisely.
6. **`?salon=` filter** on `/salons/staff/` and `/salons/business-hours/` — confirm
   whether honored or (like `/services/`) must be filtered client-side.
7. **Salon work-gallery source** (G1) — no per-salon images endpoint; dev mock today.
   Flag a backend follow-up (`GET /salons/{id}/posts/` or salon-filtered feed).
8. **Analytics tool** (PRD §11) — pick PostHog vs Firebase; `lib/analytics.ts` isolates it.

---

## 14. File manifest (what gets created / changed)

**New**
```
app/booking/_layout.tsx
app/booking/{service,schedule,details,verify,review,confirmation}.tsx
api/endpoints/bookings.ts
providers/booking-draft-provider.tsx
hooks/{use-salon,use-salon-staff,use-business-hours,use-post,use-post-booking,
       use-availability,use-slot-hold,use-create-booking,use-create-anonymous-booking,
       use-update-profile,use-my-bookings}.ts
components/ui/{g-text-field,g-otp-input,g-bottom-bar,g-step-progress}.tsx
components/post/{post-detail-view,post-salon-strip,featured-service-card}.tsx
components/salon/{salon-detail,salon-hero,salon-identity,salon-about,
                 service-list-row,staff-strip,business-hours-list}.tsx
components/booking/{booking-modal-header,service-option-row,staff-selector,
                   date-strip,date-pill,time-slot-grid,time-slot-pill,
                   booking-summary-card,hold-countdown-banner}.tsx
lib/{format,datetime,phone,analytics}.ts
```
**Changed**
```
app/_layout.tsx                 (register salon/[id] + booking modal; post/[id] header off)
app/post/[id].tsx               (replace placeholder)
app/salon/[id].tsx              (replace placeholder)
api/types.ts                    (+ §3.1 types)
api/endpoints/{salons,feed}.ts  (+ §3.2 functions)
api/query-keys.ts               (+ §3.3 keys)
api/index.ts                    (+ re-exports)
components/ui/index.ts           (+ 4 primitives)
components/salon/index.ts        (+ new salon components)
i18n/locales/pl.json            (+ §10 keys)
```

---

### TL;DR for the implementer
Build M0→M6 in order. Reuse the Explore/Find patterns wholesale: endpoints return
typed DTOs, hooks wrap TanStack Query, screens are thin and compose token-driven G*
components, lists are LegendList, copy is i18n, animation is Reanimated. The only
genuinely new concepts are the **booking modal + draft context** and the
**auth-fork create orchestration** (§8.4) — everything else is a variation on code
that already ships.
