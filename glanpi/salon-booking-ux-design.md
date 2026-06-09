# Salon Detail & Service Booking — UX / UI Design Spec

**Phase 1 deliverable** · Author: Product Design · Date: 2026-06-08
**Source of truth:** [prd.md](prd.md) (§5.2 items 3–11, §5.4, §5.5) + existing design system in [theme/](theme/) and [components/ui/](components/ui/)
**Companion doc:** [salon-booking-implementation-plan.md](salon-booking-implementation-plan.md) (Phase 2)

> This document describes **what to build and why**, screen by screen, in enough
> detail that a developer or AI agent can implement it without further design
> input. It deliberately reuses the existing Glanpi component kit and tokens —
> nothing here invents a new visual language; it extends the one already shipped
> in Explore and Find.

---

## 0. Design north star

The PRD's promise is a single sentence: *find a salon you love and book it in
under 2 minutes, account created just-in-time.* Every decision below is judged
against that:

| Principle | What it means here |
|---|---|
| **Inspiration never breaks** | Booking is presented as a **modal sheet over the photo**, not a navigation away from it. The work that inspired the booking stays one swipe behind the user the whole time. |
| **Earned friction** | No login, no forms, until a slot is chosen. Phone + name appears *after* the user has committed to a time — the moment they've "earned" the friction. |
| **One decision per screen** | Each step asks exactly one thing (which service / which time / who are you). The only screen with two controls is Schedule, where staff + date + time are intrinsically linked. |
| **Always show the cost of the next tap** | The sticky bottom bar always restates the running choice ("Wt 12 cze · 09:00 · 120 zł") so the user never feels lost in a wizard. |
| **Warm, editorial, calm** | Serif headlines (Playfair), generous beige negative space, soft taupe CTAs, one amber accent (rating star). No transactional "form" feeling — this is the anti-Booksy. |

---

## 1. Visual language quick-reference

So the implementer never has to leave this doc. All values come from [theme/tokens/](theme/tokens/).

**Color (semantic keys via `useAppTheme().app.colors`)**
- `background` `#F4EEE7` (warm beige) — screen base
- `backgroundStrong` `#EBE3D8` — inset tracks, selected-but-quiet surfaces, skeletons
- `surface` `#FFFFFF` — cards, sheets, slot pills at rest
- `primary` `#9C8577` (taupe) / `primaryPressed` `#897264` — primary buttons
- `accent` `#8A6E52` (brown) / `onAccent` white — **selected** state (chips, slots, dates), secondary emphasis
- `text` `#1C1B1A` / `textMuted` `#6E665E` / `textFaint` `#A39A8F`
- `star` `#D9A406` (amber), `success` `#3F7D4E` (confirmed), `danger` `#B3261E` (errors / cancel)

**Type (`GText variant`)** — serif on display/title, system sans on body/label
`display` (hero headline) · `title` / `titleSmall` · `body` / `bodyStrong` · `label` · `caption`

**Spacing (4-based):** xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 · xxxl 48
**Radius:** sm 8 · md 12 · lg 16 (cards) · xl 24 (sheets) · pill 999 (chips, slots, dates)
**Elevation:** `card` (soft) for cards, `raised` for sticky bottom bar / floating buttons.

**Existing kit to reuse** (`@/components/ui`): `GScreen`, `GText`, `GButton` (primary/secondary/text), `GCard`, `GChip`, `GSegmentedControl`, `GAvatar`, `GRatingBadge`, `GDivider`, `GSpinner`, `GEmptyState`, `GIconButton`, `GPressable`, `GSearchBar`.

**New primitives this feature needs** (specified in §8, built in Phase 2): `GTextField`, `GOtpInput`, `GBottomBar`, `GStepProgress`.

**Imagery:** `expo-image`, `contentFit="cover"`, `transition={150}` (matches FeedTile / ImageCollage). Dev uses seeded `picsum.photos` placeholders via the existing `mockImageUrl` convention; real per-salon media is a known backend gap (§9).

---

## 2. The journey map

```
 Explore feed  ──tap tile──▶  POST DETAIL ───────────┐
 (mosaic)                     (full-bleed work photo) │
                                  │  tap salon strip   │ tap "Zarezerwuj"
                                  ▼                     │ (featured service preselected)
 Find list   ──tap card──▶   SALON DETAIL              │
 / map                       (profile, services,       │
                              staff, hours)            │
                                  │ tap "Zarezerwuj"    │ tap a service row
                                  │ (no preselection)   │ (that service preselected)
                                  ▼                     ▼
                      ┌──────────────────────────────────────────┐
                      │   BOOKING FLOW  (modal sheet, slides up)   │
                      │                                            │
                      │  1. SERVICE   ─▶  2. SCHEDULE  ─▶  fork:    │
                      │                  (staff+date+time)         │
                      │                                            │
                      │   ┌── not signed in ──▶ 3. DETAILS ─▶ 4. SMS│
                      │   │                         (phone+name)(otp)│
                      │   └── signed in ────────▶ 3'. REVIEW         │
                      │                                            │
                      │                    ▼ (create booking)       │
                      │              5. CONFIRMATION                 │
                      │           (CONFIRMED ✓ / PENDING ⏳)         │
                      └──────────────────────────────────────────┘
                                  │ "Gotowe" / "Zobacz w kalendarzu"
                                  ▼
                         Calendar tab (My bookings — separate feature)
```

**Two entry points, one flow.** The booking modal is identical whether opened
from a post (with a preselected service) or from the salon detail. The only
difference is whether Step 1 lands pre-answered.

**Modal, not push.** The flow uses `presentation: 'modal'` so (a) the photo/salon
stays behind it, (b) swipe-down = abandon, (c) it reads as a focused task, not a
new place. Internal steps push within the modal's own stack → native back +
back-gesture for free.

**Fork on auth.** Steps 3–4 (phone → SMS) only appear for users without a live
session. A returning user (long-lived refresh token — PRD §4) skips straight to
a one-tap **Review** (3′). This is the core "account just-in-time" mechanic.

---

## 3. Screen — Post Detail

**Route:** `app/post/[id]` (replaces the current placeholder)
**Reached from:** tapping a feed tile in Explore.
**Job:** let the photo do the selling, then offer the single highest-intent action
("Zarezerwuj") without making the user think about salons, services or menus yet.

### Anatomy

```
┌─────────────────────────────┐
│ ◀  (floating, on scrim)      │   ← GIconButton in a translucent circle,
│                              │      safe-area top inset
│                              │
│        WORK PHOTO            │   ← full-bleed hero, ~62% of viewport,
│       (image_url)            │      expo-image cover. Soft top gradient
│                              │      scrim so the back button is always legible.
│                              │
├─────────────────────────────┤   ← content sheet: white surface, radius.xl
│  ✿ Włosy        ❤ 45        │      top corners, overlaps photo by ~16px
│  Balayage w odcieniu miodu  │   ← title (GText "title", serif)
│  Lorem ipsum opis pracy …   │   ← description (body, muted), clamp 2 lines
│  więcej                      │      + "więcej" expander if longer
│  ───────────────────────    │
│  ◐ Anna Kowalski            │   ← author/staff row (GAvatar sm + "label")
│                              │      shown only when post.author present
│  ┌─────────────────────────┐│
│  │ ◐ Glamour Studio   ★4.5 ›││   ← salon strip (GCard, pressable → salon detail)
│  │   Mokotów, Warszawa     ││      avatar + name + GRatingBadge + city, chevron
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ Usługa ze zdjęcia        ││   ← featured-service card (only if featured_service)
│  │ Balayage · 90 min · 320 zł││     subtle accent-tinted card; sets the
│  └─────────────────────────┘│      preselected service for booking
└─────────────────────────────┘
  ┌───────────────────────────┐
  │      Zarezerwuj            │   ← GBottomBar: primary GButton full-width,
  └───────────────────────────┘      raised, over safe-area bottom inset
```

### Behavior & states
- **Primary CTA "Zarezerwuj"** → opens the booking modal. If the post has a
  `featured_service`, that service is passed in preselected (Step 1 lands answered).
  Otherwise the flow starts at service selection. (PRD §5.2.4 — "usługa z posta
  wstępnie zaznaczona … w pełni edytowalna".)
- **Salon strip tap** → pushes the Salon Detail screen (the *Explore → post →
  salon* path). Lets the curious user see the full profile without committing to
  booking. The press **prefetches** the salon's services/staff/hours so Salon
  Detail paints instantly (see *Data & composition* below).
- **Author row** is informational only (no nav in MVP — staff profiles are out of scope).
- **Image** uses the post's `image_url`; in dev it falls back to the seeded mock
  (the feed already does this — see [to-feed-tiles.ts](components/feed/to-feed-tiles.ts)).
- **Loading:** the post is usually already warm in the feed cache. If opened cold,
  show a full-bleed skeleton rectangle for the hero + 3 shimmer lines; the bottom
  CTA appears disabled until data resolves.
- **Error / not found:** `GEmptyState` (icon `image-off-outline`, "Nie znaleziono
  tej pracy", retry). Back button still floats.
- **View tracking:** firing `POST /feed/posts/{id}/view/` is automatic server-side
  on `GET /feed/posts/{id}/` — no client action needed.

### Data & composition (Explore → post → salon)
The post-level payloads (`FeedPost.salon`, `salon_booking.salon`) carry **no
rating**, so the salon strip would otherwise have nothing to show beside the name.
To make the *inspiration → salon* hop feel complete and instant:
- Post Detail also reads `useSalon(salonId)` once the salon id is known. The strip
  renders **name + city immediately** and the **★ rating fills in** when that call
  resolves — it never blocks the photo (graceful enrichment, not a gate).
- That same `useSalon` call **warms the salon identity cache**; tapping the strip
  additionally **prefetches** the salon's services/staff/hours. By the time Salon
  Detail mounts it's already (mostly) cached → it paints with **no spinner** between
  the post and the profile.
- Salon id source: prefer `salon_booking.salon.id` (the canonical id also used for
  booking), falling back to `FeedPost.salon.id`, so post, salon screen and booking
  flow all agree. (Implementation: plan §8.6.)

### Motion
- Hero image scales subtly (1.0→1.03) on a slow pull-down past the top (Reanimated
  `useAnimatedScrollHandler`), the "stretchy header" feel. Optional polish.
- Sheet content fades + rises 8px on mount (200ms) so the page feels composed,
  not stamped.

### Copy (PL)
- CTA: **Zarezerwuj**
- Featured card label: **Usługa ze zdjęcia**
- Expander: **więcej** / **mniej**

---

## 4. Screen — Salon Detail

**Route:** `app/salon/[id]` (replaces the current placeholder)
**Reached from:** Find list/map card, or the Post Detail salon strip.
**Job:** the full, trustworthy salon profile — and a frictionless path into booking,
either via the bottom CTA or by tapping any individual service.

### Layout strategy
A single vertically-scrolling page. Per the LegendList-only rule, it is built as
**one `LegendList` whose `data` is the services array**, with everything above
(gallery, identity, about) as `ListHeaderComponent` and everything below (staff,
hours) as `ListFooterComponent`. A scroll-collapsing compact header (reuse
[useCollapsingHeader](components/layout/use-collapsing-header.ts)) fades in the
salon name + back button once the gallery scrolls away.

### Anatomy

```
┌─────────────────────────────┐
│ ◀                       ⤴   │  ← floating back + share, on gallery scrim
│                              │
│   ◀ ░░ GALLERY  ░░ ▶        │  ← horizontal image pager (salon work),
│        ● ● ○ ○               │     height ~280, paging dots. expo-image.
├─────────────────────────────┤
│  Glamour Studio              │  ← name (GText "display"/"title", serif)
│  ★ 4.5  (24 opinie)         │  ← GRatingBadge (rating + review count)
│  📍 Mokotów · ul. Różana 12  │  ← address line (caption, muted)
│                              │
│  [ Zadzwoń ] [ Trasa ]       │  ← secondary/text GButtons (phone, maps deep-link)
│                              │
│  Otwarte teraz · do 18:00    │  ← open/closed pill derived from business-hours
│  ───────────────────────    │
│  O salonie                   │  ← section title (titleSmall)
│  Lorem ipsum … więcej        │  ← description, clamp 3 lines + expander
│  ───────────────────────    │
│  Usługi                      │  ← section title  ◀── ListHeader ends here
│  ┌─────────────────────────┐│
│  │ Strzyżenie damskie       ││  ← service row (the LegendList items):
│  │ 45 min            120 zł ⊕││     name (bodyStrong) / "45 min" (caption)
│  └─────────────────────────┘│     / price (body) / ⊕ add affordance
│  │ Koloryzacja · 90 min …   ││  tap row → booking with this service preselected
│  │ Balayage · 120 min …     ││
│  ───────────────────────    │  ◀── ListFooter starts here
│  Zespół                      │  ← staff strip (horizontal avatars + names),
│  ◐ Anna  ◐ Kasia  ◐ Marta   ││     informational in MVP (everyone does everything)
│  ───────────────────────    │
│  Godziny otwarcia            │  ← business-hours list, today row emphasized
│  Pon  9:00–18:00             │
│  Wt   9:00–18:00   ··· Dziś  │
│  …    Niedz.  Zamknięte      │
└─────────────────────────────┘
  ┌───────────────────────────┐
  │     Zarezerwuj wizytę      │  ← GBottomBar primary CTA (no preselection)
  └───────────────────────────┘
```

### Behavior & states
- **Bottom CTA "Zarezerwuj wizytę"** → booking modal starting at Service selection
  (no preselection).
- **Tapping a service row** → booking modal with that service preselected (the fast
  path; matches the Find card's whole-card-taps-through intent).
- **"Zadzwoń"** → `tel:` link from `salon.phone`. **"Trasa"** → maps deep-link from
  `latitude/longitude` (or address fallback). **Share** → `expo-sharing`/native share
  (nice-to-have, can ship later).
- **Open-now pill** computed from `business-hours` in the salon's `timezone`
  ("Otwarte teraz · do 18:00" / "Zamknięte · otwiera 9:00" / "Zamknięte dziś").
- **Reviews:** per PRD §6 the reviews *list* UI is out of MVP — we show only the
  aggregate `GRatingBadge` in the identity block. No reviews section.
- **Loading:** skeleton gallery rectangle + shimmer identity lines + 3 ghost
  service rows. Bottom CTA disabled until the salon resolves.
- **Error:** `GEmptyState` ("Nie udało się wczytać salonu", retry).
- **No services edge:** services section shows a one-line muted note ("Ten salon
  nie dodał jeszcze usług") and the bottom CTA is hidden (nothing to book).

### Data
`GET /salons/salons/{id}/` (identity) · services via the existing shared fetch
filtered client-side (reuse [use-salon-services](hooks/use-salon-services.ts)) ·
`GET /salons/staff/?salon={id}` · `GET /salons/business-hours/?salon={id}`.
Gallery media: dev mock today; real source is a backend gap (§9).

### Motion
Compact sticky header crossfades the salon name in at the collapse threshold
(identical mechanic to Explore). Service rows give a light `expo-haptics` tap on
press (matches `HapticTab`).

---

## 5. The Booking Flow (modal)

A modal sheet containing its own step stack. Shared chrome across all steps:

### 5.0 Flow chrome

**Top bar** (every step):
```
┌─────────────────────────────┐
│ ✕            Wybierz termin   │  ← left: close (✕) abandons the whole flow
│ ▰▰▰▰▰▰▱▱▱▱▱▱                  │  ← GStepProgress: 3 segments fill as the user
└─────────────────────────────┘     advances (Usługa · Termin · Dane/Potwierdź)
```
- **✕** always closes the entire modal (with a confirm sheet only if a slot hold is
  active — "Porzucić rezerwację?"). Native **back-gesture / hardware back** goes one
  step back within the flow.
- **Title** names the current step. **GStepProgress** is a thin 3-segment bar (not a
  numbered "step 2 of 5") so adding/removing the auth fork doesn't change the count.
  Segments map to: ① Service · ② Schedule · ③ Finalize (details+SMS *or* review).
- **Sticky bottom bar** (`GBottomBar`) on every step carries the running summary on
  the left and the forward CTA on the right; CTA disabled until the step's one
  decision is made.

### 5.1 Step 1 — Service selection

**Route:** `app/booking/service`
**Job:** pick the one service to book (PRD §5.2.5). Preselected when entered from a post/service row, fully editable.

```
┌─────────────────────────────┐
│ ✕              Wybierz usługę │
│ ▰▰▰▱▱▱▱▱▱▱▱▱                  │
├─────────────────────────────┤
│  ◉ Balayage          Ze zdjęcia│ ← preselected row: accent left-bar + filled
│    120 min            320 zł  │   radio; "Ze zdjęcia" chip when it came from a post
│  ───────────────────────    │
│  ○ Strzyżenie damskie        │ ← unselected rows: hairline divider, hollow radio
│    45 min             120 zł  │
│  ○ Koloryzacja               │
│    90 min             260 zł  │
│  ○ Modelowanie               │
│    30 min              80 zł  │
└─────────────────────────────┘
  ┌───────────────────────────┐
  │ Balayage · 120 min   Dalej │ ← summary + primary CTA (enabled once selected)
  └───────────────────────────┘
```

- **Single-select**, radio semantics. Tapping a row selects it (light haptic);
  **Dalej** advances. With a preselection, the row is selected on mount, the list
  auto-scrolls it into view, and **Dalej** is immediately enabled.
- Price formatting: `price_display` → "320 zł" via the existing rule in
  [salon-list-item.tsx](components/find/salon-list-item.tsx) (`Math.round(Number) + " zł"`);
  null price → duration only, no price shown.
- **Optimization (optional):** when entered with a preselected service *and* the
  salon has only that one obvious choice, the flow MAY auto-advance to Schedule and
  surface Service as an editable summary chip there. Default behavior: always show
  Step 1 (one tap of "Dalej") for clarity. Keep it simple first.
- **Empty:** if no services, `GEmptyState` + the flow can't proceed (shouldn't
  happen from a post that has a salon with services).

### 5.2 Step 2 — Schedule (staff + date + time)

**Route:** `app/booking/schedule`
**Job:** the heart of the flow — choose who, which day, which time (PRD §5.2.6–7, §5.5).
Staff is folded in here (not a separate step) to protect momentum; in MVP everyone
performs every service and slots are salon-wide, so staff defaults to the
recommended person and rarely needs changing.

```
┌─────────────────────────────┐
│ ◀              Wybierz termin │
│ ▰▰▰▰▰▰▱▱▱▱▱▱                  │
├─────────────────────────────┤
│  Balayage · 120 min · 320 zł ✎│ ← editable service summary (tap ✎ → Step 1)
│                              │
│  Specjalista                 │ ← staff selector (hidden if salon has 1 staff)
│  ◉Anna  ○Kasia  ○Marta       │   horizontal avatars; "Polecany" badge on default
│                              │
│  Czerwiec 2026               │ ← month label, updates with the date strip
│  ┌──┬──┬──┬──┬──┬──┐         │
│  │Dziś│Pt│So│Nd│Pn│Wt│ …     │ ← horizontal DATE STRIP (pills): weekday + day no.
│  │ 12 │13│14│15│16│17│       │   closed days are muted+disabled; selected = brown
│  └──┴──┴──┴──┴──┴──┘         │
│                              │
│  Rano                        │ ← optional part-of-day grouping for scannability
│  [09:00] [09:45] [10:30]     │ ← TIME SLOT GRID: pills, 3 cols. selected = brown.
│  Popołudnie                  │
│  [12:15] [13:00] [13:45] …   │
│  Wieczór                     │
│  [16:30] [17:15]             │
└─────────────────────────────┘
  ┌───────────────────────────┐
  │ Wt 12 cze · 09:00    Dalej │ ← summary + CTA (enabled once a slot is selected)
  └───────────────────────────┘
```

- **Staff selector:** horizontal avatars from `salon_booking.staff_members` (or
  `GET /salons/staff/?salon=`). Default = `salon_booking.recommended_staff` (badge
  "Polecany") else first staff. Changing staff **refetches availability**. Hidden
  entirely when the salon has a single staff member. (Rationale & the "no Dowolny"
  decision: §9 / Open decision D2.)
- **Date strip:** today + ~14 forward days (lazy-extend on scroll-end). Each pill:
  weekday short ("Pt") over day number ("13"); today labeled "Dziś". Days the salon
  is closed (from business-hours `is_closed`) are muted and non-selectable. Selected
  pill = `accent` fill, `onAccent` text. Horizontal `LegendList`.
- **Time slots:** from `GET /bookings/availability/?salon&service&staff&date`. Each
  pill shows `display.start_time` ("09:00"); the pill carries the option's `slot_ids`
  + `start_datetime` for the eventual booking call. Selecting fills it brown + light
  haptic. Optional Rano/Popołudnie/Wieczór section headers (split on <12 / <17 / ≥17
  local hour) — drop them if it complicates v1; a flat wrapped grid is acceptable.
- **States within the slot area** (the part that reloads on date/staff change):
  - *Loading:* a 2-row grid of shimmer pills (don't blank the whole screen — keep
    the date strip interactive).
  - *Empty:* centered muted note "Brak wolnych terminów tego dnia" + sub-hint
    "Wybierz inny dzień." (Waitlist is out of MVP UI per PRD §6 — no waitlist CTA.)
  - *Error:* inline "Nie udało się wczytać terminów" + small "Spróbuj ponownie".
- **Dalej** → see §5.5 (fork: hold → details/verify, or → review if signed in).

### 5.3 Step 3 — Your details (phone + name) · *unauthenticated only*

**Route:** `app/booking/details`
**Job:** collect exactly what's needed to create an account + booking (PRD §5.2.8),
no more. First appearance of any text entry in the whole journey.

```
┌─────────────────────────────┐
│ ◀                 Twoje dane │
│ ▰▰▰▰▰▰▰▰▰▱▱▱                  │
├─────────────────────────────┤
│  🔒 Termin zarezerwowany 4:38 │ ← hold countdown banner (only if hold active),
│                              │     calm muted style, not alarming
│  Aby potwierdzić rezerwację, │
│  podaj swoje dane.           │ ← one-line rationale (body, muted)
│                              │
│  Imię                        │
│  ┌─────────────────────────┐│ ← GTextField
│  │ Anna                     ││
│  └─────────────────────────┘│
│  Nazwisko                    │
│  ┌─────────────────────────┐│
│  │ Kowalska                 ││
│  └─────────────────────────┘│
│  Numer telefonu              │
│  ┌────┬────────────────────┐│
│  │ +48│ 600 700 800        ││ ← phone field: fixed +48 prefix + 9-digit national,
│  └────┴────────────────────┘│   numeric keypad
│                              │
│  Wyślemy SMS z kodem na ten  │
│  numer.                      │ ← caption, faint
└─────────────────────────────┘
  ┌───────────────────────────┐
  │              Wyślij kod    │ ← primary CTA → POST .../phone/initiate/
  └───────────────────────────┘
```

- **Validation:** first name required; phone = exactly 9 digits → compose
  `+48XXXXXXXXX` (E.164). CTA disabled until valid. Last name optional but
  encouraged (the salon sees it on the booking).
- **CTA "Wyślij kod"** → `initiatePhoneAuth({ phone })`. On success → SMS step
  carrying `phone_number_hint` + `resend_wait_seconds`. On **429** → keep on screen,
  disable CTA, show "Zbyt wiele prób. Spróbuj za {n}s" counting down `retryAfterSeconds`.
- **Hold banner:** if a slot hold was created on entering this step, show the live
  countdown (mm:ss). When it hits 0 → see expiry handling (§5.6).
- Keyboard: field-appropriate keyboards; CTA stays visible above the keyboard
  (keyboard-avoiding). No inner scroll-list (it's a short form).

### 5.4 Step 4 — SMS code · *unauthenticated only*

**Route:** `app/booking/verify`
**Job:** verify the number → JWT → create the account + booking (PRD §5.2.9).

```
┌─────────────────────────────┐
│ ◀             Potwierdź numer │
│ ▰▰▰▰▰▰▰▰▰▰▰▰                  │
├─────────────────────────────┤
│  🔒 Termin zarezerwowany 4:05 │ ← hold countdown continues here
│                              │
│  Wpisz kod                   │ ← title (serif)
│  Wysłaliśmy 4-cyfrowy kod na │
│  +48 ••• ••• 800             │ ← phone_number_hint (body, muted)
│                              │
│      ┌──┐┌──┐┌──┐┌──┐        │ ← GOtpInput: 4 boxes, auto-advance,
│      │1 ││1 ││  ││  │        │   iOS SMS autofill, auto-submit on full
│      └──┘└──┘└──┘└──┘        │
│                              │
│  Nie otrzymałeś kodu?        │
│  Wyślij ponownie (0:23)      │ ← resend link, disabled until countdown ends
└─────────────────────────────┘
       (no bottom CTA — auto-submits)
```

- **Auto-submit** when 4 digits entered → `verifyPhoneAuth({ phone, code })`. On
  success the existing `useVerifyPhoneAuth` persists the JWT + user via
  [auth-provider](providers/auth-provider.tsx) `signIn`. Then the flow:
  1. if the verified user is new (`created`) or has no `first_name`, `PATCH /accounts/me/`
     with the name from Step 3;
  2. creates the booking (`POST /bookings/`); → Confirmation.
  These run as a short **"Tworzymy rezerwację…"** spinner state overlaying this
  screen (or on Confirmation — either is fine; keep the user on one screen while it
  resolves).
- **Errors:** wrong code → boxes flash `danger`, clear, inline "Nieprawidłowy kod";
  expired/too many attempts (401) → "Kod wygasł. Wyślij nowy."; 429 → backoff on the
  resend link.
- **Resend** → `resendCode({ phone })`, resets the countdown from the new
  `resend_wait_seconds`.

### 5.5 Step 3′ — Review & confirm · *authenticated only*

**Route:** `app/booking/review`
**Job:** for a signed-in returning user, replace the entire phone+SMS detour with a
single explicit confirm — the "book in seconds" payoff.

```
┌─────────────────────────────┐
│ ◀          Potwierdź rezerwację│
│ ▰▰▰▰▰▰▰▰▰▰▰▰                  │
├─────────────────────────────┤
│  ┌─────────────────────────┐ │
│  │ ◐ Glamour Studio          │ │ ← BookingSummaryCard (shared with Confirmation):
│  │   Balayage · 120 min      │ │   salon, service, staff, date+time (salon tz),
│  │   z Anna Kowalską         │ │   duration, price, address
│  │   Wt, 12 cze · 09:00      │ │
│  │   320 zł                  │ │
│  │   📍 ul. Różana 12         │ │
│  └─────────────────────────┘ │
│                              │
│  Rezerwujesz jako            │
│  Anna Kowalska · +48 …800    │ ← who we're booking as (from /me)
│                              │
│  Anulowanie bezpłatne do 24h │ ← cancellation-policy hint (if known), caption
│  przed wizytą.               │
└─────────────────────────────┘
  ┌───────────────────────────┐
  │            Zarezerwuj      │ ← primary CTA → POST /bookings/ → Confirmation
  └───────────────────────────┘
```

- Reached from Schedule's **Dalej** when a session is already live. CTA fires
  `POST /bookings/ { salon, service, staff, start_time }` (start_time = the chosen
  option's `start_datetime`), shows a brief submitting state, then → Confirmation.
- If `/me` lacks a name, fall through to Step 3 (Details) instead, so the salon
  always gets a name. (Edge: rare.)

### 5.6 Step 5 — Confirmation

**Route:** `app/booking/confirmation`
**Job:** close the loop with a clear status (PRD §5.2.10, §5.4). Two variants driven
purely by the created booking's `status`.

```
   CONFIRMED (auto-accept)            PENDING (manual / new client)
┌─────────────────────────────┐  ┌─────────────────────────────┐
│             ✓                │  │             ⏳               │
│      (success green,         │  │      (accent, gentle)        │
│       gentle scale-in)       │  │                              │
│  Rezerwacja potwierdzona!    │  │  Prośba wysłana              │
│  Do zobaczenia 12 czerwca.   │  │  Salon potwierdzi wkrótce —  │
│                              │  │  damy znać przez powiadomienie│
│  ┌─────────────────────────┐ │  │  ┌─────────────────────────┐ │
│  │   BookingSummaryCard     │ │  │  │   BookingSummaryCard     │ │
│  └─────────────────────────┘ │  │  └─────────────────────────┘ │
│                              │  │                              │
│  Dodaliśmy to do kalendarza. │  │                              │
└─────────────────────────────┘  └─────────────────────────────┘
  ┌───────────────────────────┐    ┌───────────────────────────┐
  │   Zobacz w kalendarzu      │    │   Zobacz w kalendarzu      │ ← secondary
  │          Gotowe            │    │          Gotowe            │ ← primary
  └───────────────────────────┘    └───────────────────────────┘
```

- **CONFIRMED:** success-green check, celebratory but tasteful (Reanimated scale +
  fade-in of the check, ~400ms; no confetti spam). Headline serif.
- **PENDING:** accent hourglass, reassuring copy. This is also the path for any new/
  unverified-history client even at auto-accept salons (PRD §5.4 anti-abuse) — the
  client shows PENDING; no special branch needed.
- **No back.** Confirmation removes the step stack from history (`router.dismissAll`
  + replace) so back/✕ can't return into a completed flow. ✕/Gotowe close the modal.
- **"Zobacz w kalendarzu"** closes the modal and routes to the Calendar tab (My
  bookings — a separate feature; this is the handoff).
- **Failure to create** (slot taken, limit hit, network) is handled *before* landing
  here — see §5.7. Confirmation is only ever the success terminus.

### 5.7 Auth/booking orchestration (the seam between Schedule and Confirmation)

What happens on Schedule's **Dalej**:

```
slot selected → Dalej
   │
   ├─ (recommended) create slot hold  POST /bookings/holds/ {slot_ids}
   │     └─ start 5-min countdown shown on subsequent steps
   │
   ├─ signed in?
   │     ├─ yes, /me has name ─────▶ Review (3′) ──[Zarezerwuj]──┐
   │     ├─ yes, no name ──────────▶ Details (3) … (collect, no SMS needed) ─┐
   │     └─ no ─────────────────────▶ Details (3) → SMS (4) ──[verify]───────┤
   │                                                                          │
   └─ create booking  POST /bookings/ { salon, service, staff, start_time } ◀─┘
         ├─ 201 → Confirmation (reads booking.status: CONFIRMED|PENDING)
         ├─ slot-taken / 400-409 → toast "Ten termin został właśnie zajęty" →
         │     pop back to Schedule, refetch availability, clear selection
         ├─ active-booking-limit (PRD anti-abuse) 400 → friendly explain, stay
         └─ network/timeout → retry affordance on the current step
```

- **Authenticated path** uses `POST /bookings/` by `start_time` (PRD §12 mapping).
  Anonymous booking endpoints exist as a fallback but the PRD's chosen flow creates
  the account at SMS, so authenticated create is primary. (Open decision D1, §9.)
- **Hold** (`POST /bookings/holds/`, 5-min TTL) is advisory: it reduces the chance
  of a collision during the SMS window. The authoritative safety net is handling a
  create failure gracefully. Hold is recommended-on but the flow is correct without
  it (Open decision D3).

---

## 6. Cross-cutting states & micro-interactions

| Situation | Treatment |
|---|---|
| **Loading (first paint)** | Skeletons that mirror final layout (gallery rect, ghost rows, shimmer slot pills) — never a bare centered spinner on content screens. `GSpinner` only for tiny inline/footer cases and the brief "creating booking" state. |
| **Empty** | `GEmptyState` with a specific, kind message + an action when one exists (retry / pick another day). Never a dead end. |
| **Error (network)** | Inline retry on the failing region; full-screen `GEmptyState` (icon `wifi-off`) only when the whole screen has no data. Messages come from `ApiError.message` when user-friendly, else a generic localized fallback. |
| **Slot taken mid-flow** | Toast + auto-return to Schedule with fresh availability. Reassuring, not blaming. |
| **Hold expired** | Banner flips to "Czas minął — wybierz termin ponownie"; forward CTA disabled; tapping returns to Schedule. |
| **Rate limit (429)** | Countdown using `retryAfterSeconds`; CTA disabled meanwhile. |
| **Selection feedback** | `expo-haptics` light impact on selecting a service/date/slot (consistent with `HapticTab`). |
| **Button busy** | Primary `GButton` shows its built-in spinner (`loading` prop) and disables; label → present-progressive ("Wysyłanie…", "Tworzymy rezerwację…"). |

**Motion budget (Reanimated only — never RN `Animated`):** step transitions are the
native stack push/pop; sheet enters as a modal slide-up; content within a step
fades+rises 8px on mount (200ms); selected pills animate fill color (150ms); the
Confirmation check scales-in. Nothing bounces or spins gratuitously — the brand is
calm.

**Accessibility:** every pill/row/button has an `accessibilityRole` +
`accessibilityLabel` (e.g. a slot announces "09:00, dostępny termin"); selected
state via `accessibilityState={{ selected }}`; OTP boxes are a single logical field
for screen readers; touch targets ≥ 44pt (slots/dates sized accordingly); color is
never the only signal (selected pills also carry a check/contrast, disabled days are
dimmed *and* non-actionable). Respect `prefers-reduced-motion` by skipping the
scale-in.

---

## 7. Analytics (PRD §3 funnel)

Fire these as the user advances (tool TBD — PRD open item; wire a thin `track()` now,
no-op until PostHog/Firebase is chosen):

| Event | Fires on |
|---|---|
| `post_open` | Post Detail mount |
| `salon_open` | Salon Detail mount |
| `booking_start` | Booking modal mount (with `entry: post｜salon`, `preselected: bool`) |
| `service_select` | Step 1 Dalej (`service_id`) |
| `slot_select` | Step 2 Dalej (`date`, `start_time`, `staff_id`) |
| `phone_submit` | Details "Wyślij kod" success |
| `booking_created` | `POST /bookings/` 201 (`status`) |
| `booking_confirmed` | Confirmation shown with `status=CONFIRMED` |

---

## 8. New design-system primitives (specs)

These belong in `components/ui/` and follow the existing G* wrapper pattern (thin,
token-driven, hides Paper). Built in Phase 2 §.

1. **`GTextField`** — labeled text input wrapping Paper `TextInput`. Props: `label`,
   `value`, `onChangeText`, `error?`, `keyboardType?`, `autoComplete?`, `right?`
   (slot, e.g. the +48 prefix). Outlined, `radius.md`, 56pt tall (matches `GSelect`),
   `outline`/`primary` border, `danger` border + helper text on error.
2. **`GOtpInput`** — fixed-length code entry (default 4). Props: `length`, `value`,
   `onChange`, `onComplete`, `error?`. Renders N boxes, auto-advances, supports paste
   + iOS one-time-code autofill, exposes a single accessible field. Filled box =
   `accent` border; error = `danger` flash.
3. **`GBottomBar`** — sticky bottom container honoring the safe-area inset, `surface`
   background + top hairline + `raised` elevation. Slots: `summary?` (left) + the
   action button(s) (right/full-width). Used on Post/Salon detail and every booking step.
4. **`GStepProgress`** — thin segmented progress bar. Props: `steps` (count),
   `current` (index). `accent` fill for completed/active, `backgroundStrong` track.

Also two small composite/booking components worth naming (in `components/booking/`):
`BookingSummaryCard` (shared by Review + Confirmation), `HoldCountdownBanner`,
`DateStrip`, `TimeSlotGrid`, `StaffSelector` — full inventory in the Phase 2 plan.

---

## 9. Open design decisions & known gaps

These are resolved with a recommendation so implementation isn't blocked; revisit if
product disagrees. They map to PRD §11.

- **D1 — Authenticated vs anonymous booking.** *Recommendation: authenticated.* The
  PRD flow creates the account at the SMS step (§5.2.8–9), so `POST /bookings/` (JWT)
  is the natural create call and "My bookings" works for free. Anonymous endpoints
  (`create_anonymous`, `cancel_anonymous`) remain a documented fallback.
- **D2 — Staff: inline selector, recommended-default, no "Dowolny".** Availability
  requires a concrete `staff` id, so an "Any" option would be ambiguous to book.
  Default to `recommended_staff` (or first), let the user switch, hide the control
  entirely for single-staff salons. Keeps the order service→staff (PRD §5.2.6)
  without adding a screen.
- **D3 — Slot hold: recommended ON.** Protects the slot during the SMS window (PRD
  §11 leans yes). The flow is correct without it because create-failure is handled
  gracefully; ship hold if the hold→authenticated-create association is confirmed on
  the backend, otherwise treat create-failure as the safety net.
- **D4 — Date picker: horizontal strip, not full month.** Faster, calmer, fits the
  "<2 min" goal. A full-calendar sheet is a later enhancement.
- **G1 — Salon/post gallery media (gap).** There is no per-salon work-image endpoint
  (`city_feed` can't filter by salon; `?salon=` is ignored). Dev uses the existing
  seeded `mockImageUrl`; production shows a tasteful placeholder until a backend
  source (`GET /salons/{id}/posts/` or a salon-filtered feed) exists. Same limitation
  the Find cards already live with.
- **G2 — Currency.** API examples show "$"; the team already formats `price_display`
  as "zł" client-side (Find). Continue that; revisit when the backend localizes price.
- **G3 — `salon_booking.services` lacks price.** The tap-to-book payload's `services`
  omit `price_display` (only `featured_service` has it). Merge with `/salons/services/`
  (which has price) to show prices in Step 1 — see Phase 2.

---

## 10. Definition of done (UX acceptance)

A reviewer should be able to verify, on device, with the DEBUG test number
`+48111111111` / code `1111`:

1. Tap a feed tile → Post Detail shows the photo, salon strip, and (if present) the
   featured service; "Zarezerwuj" opens the modal with that service preselected.
2. From Find → Salon Detail shows identity, services, staff, hours; tapping a service
   row opens the modal with it preselected; the bottom CTA opens it with none.
3. Schedule lets me switch staff, scroll dates (closed days disabled), pick a slot;
   the bottom summary always reflects my running choice.
4. Signed-out: Details → SMS (autofill works) → booking created → Confirmation shows
   the right status. Signed-in: Schedule → Review → one tap → Confirmation.
5. Empty/loading/error/slot-taken/hold-expiry/429 all render the specified states —
   no dead ends, no raw error strings, no bare spinners on content screens.
6. The whole signed-in path completes in well under 2 minutes; the photo is always
   one swipe-down behind the modal.
```
