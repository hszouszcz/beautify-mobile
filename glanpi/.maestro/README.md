# Maestro E2E flows

End-to-end UI flows for the Beautify booking app. Maestro drives a **real build**
of the app on a booted simulator/emulator — it is not part of the Jest suite and
is **not** run in CI by default (it needs a device + the backend).

## Prerequisites

1. Install the Maestro CLI (standalone binary, needs a JDK):
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   # then add ~/.maestro/bin to PATH (the installer prints the exact line)
   ```
2. Build and install a dev build on a booted device:
   ```bash
   npx expo run:ios       # or: npx expo run:android
   ```
   The flows target appId **`com.hszcz.glanpi`** (iOS bundle id). For Android,
   set `expo.android.package` in `app.json` (currently unset) and update the
   `appId` in each flow/subflow to match.
3. Point the app at a backend whose SMS step accepts the dev code **`1111`**
   (see `EXPO_PUBLIC_API_URL`). Set a real test phone via the flow `env`.

## Run

```bash
maestro test .maestro/flows            # whole suite (or: npm run test:e2e)
maestro test .maestro/flows/03-auth-otp-booking.yaml   # one flow
maestro studio                          # interactive selector explorer
```

## Flows

| File | Journey |
|------|---------|
| `01-browse-and-book-from-feed.yaml` | Explore feed → post → start booking |
| `02-search-and-book-from-salon.yaml` | Find → search → salon → start booking |
| `03-auth-otp-booking.yaml` | Full unauthenticated booking incl. phone + OTP → confirmation |
| `04-find-filters.yaml` | Open availability filters → apply → list updates |
| `05-booking-confirmation-state.yaml` | Salon-entry booking → confirmation state (CONFIRMED/PENDING) |

Shared steps live in `subflows/` (`launch`, `complete-schedule`) and are pulled
in with `runFlow` to keep the flows DRY.

## Selector inventory (testIDs)

Stable `testID`s the flows rely on (add new ones here as flows grow):

- Feed: `feed-tile-<postId>`
- Find: `find-search-input`, `salon-card-<salonId>`, `filter-button`
- Salon / post CTAs: `salon-book-cta`, `post-book-cta`
- Booking funnel: `service-row-<serviceId>`, `booking-service-next`,
  `booking-schedule-next`, `field-firstName`, `field-lastName`, `field-phone`,
  `booking-details-send`, `otp-input`, `booking-review-confirm`, `booking-done`,
  `find-filters-apply`

Time-slot pills are matched by their a11y label (`"<time>, dostępny termin"`)
rather than a testID.

## Optional: Maestro Cloud

`maestro cloud` runs flows on hosted devices (has a free tier) — useful if you
later want E2E in CI without paying for GitHub's 10×-billed macOS runners.
