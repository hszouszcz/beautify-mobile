# Aplikacja - Beautify (MVP)
Beautify is a mobile-first beauty salon booking app with a Django REST Framework backend. The core idea: users discover salons through an Instagram-like visual feed, then book appointments — with phone-number SMS auth as the only identity method (no email/password).
## Główny problem
The gap between visual inspiration and frictionless booking.

Right now, beauty consumers live in two separate worlds:

Discovery happens on Instagram — people find salons, stylists, nail artists by browsing work. But Instagram has no booking. You DM, call, or go hunt for a third-party site.

Booking happens on transactional platforms (Booksy, Treatwell, etc.) — but these are ugly, form-heavy, and demand registration before you can even browse. The conversion killer is asking for an account before the user has decided they want anything.

The result: a broken journey. You see a haircut you love, you lose momentum crossing the gap from inspiration to appointment.

Beautify's design directly encodes the solution — every architectural choice points at this problem:

Feed-first (not search-first) because discovery is emotional, not transactional
Anonymous browsing all the way to time selection, because commitment should be earned
Phone-only auth (one step, no password) because the moment you show a registration form, you've already lost half the users
"Tap-to-book" on feed posts because the booking should happen inside the inspirational moment, not after it
The secondary pain point it also touches: salons have no owned channel that is both visual and bookable. They're stuck paying Instagram for reach and Booksy for bookings — Beautify could be the platform that collapses both into one.

## Najmniejszy zestaw funkcjonalności
Availability setup - when you are available for clients, duration of booking slots, what kind of services you provide
City selector	Entry point, sets feed context
Feed	Scrollable posts, city-filtered
Post / Salon detail	Work preview + salon info + CTA to book
Service & staff selection	Pick what you want and who
Availability calendar	Date picker + time slots grid
Phone entry	First auth screen
SMS code entry	Verify code
Booking confirmation	"You're booked" — date, time, salon, service


## Co NIE wchodzi w zakres MVP
Onboarding / tutorial
Payment
Settings screen
Booking history / "my appointments"
User profile screen
Push notifications
Ratings & reviews
Favorites / saved salons
Staff upload flow (use backend admin or web for now)

## Kryteria sukcesu
A user with no account can open the app, find a salon they like, and book an appointment — in under 2 minutes, quick account create and book.