# PRD — Beautify (MVP)

**Wersja:** 1.1
**Data:** 2026-06-07
**Status:** Zatwierdzony do realizacji MVP
**Autorzy:** zespół Beautify (1× mobile RN, 1× backend DRF)

> **Zmiany w 1.1:** walidacja względem istniejącego backendu (`API_DOCUMENTATION.md`, `MOBILE_QUICK_REFERENCE.md`). Backend jest gotowy i wspiera obie role (klient + salon). Zrównano statusy rezerwacji, politykę anulowania, model autentykacji (JWT) i storage zdjęć z realnym API. Dodano sekcję 12 „Zgodność z backendem".

---

## 1. Streszczenie produktu

Beautify to **mobile-first** aplikacja do rezerwacji usług beauty (salony, fryzjerzy, stylistki paznokci, makijaż), zbudowana wokół **wizualnego feedu w stylu Instagrama/Pinteresta**. Użytkownik najpierw odkrywa prace salonów emocjonalnie (przeglądając zdjęcia), a dopiero potem rezerwuje wizytę — bez konieczności rejestracji do momentu tuż przed bookingiem.

- **Frontend:** React Native (iOS + Android), jedna aplikacja dla obu ról (klient i salon).
- **Backend:** Django REST Framework — **gotowy i produkcyjny** (auth, feed, anonimowe przeglądanie, rezerwacje, endpointy zarządzania salonem, upload zdjęć do S3, push/FCM). Szczegóły: [API_DOCUMENTATION.md](../API_DOCUMENTATION.md), [MOBILE_QUICK_REFERENCE.md](../MOBILE_QUICK_REFERENCE.md). Praca MVP koncentruje się na warstwie mobilnej.
- **Tożsamość:** wyłącznie numer telefonu + kod SMS (brak e-maila/hasła); tokeny JWT (access + refresh).
- **Rynek startowy:** Polska. UI przygotowany na wielojęzyczność (i18n setup), bez tłumaczeń na tym etapie.

---

## 2. Problem

**Główny problem: luka między wizualną inspiracją a bezproblemową rezerwacją.**

Obecnie konsument beauty żyje w dwóch oddzielnych światach:

- **Odkrywanie** dzieje się na Instagramie — ludzie znajdują salony i artystów, przeglądając prace. Ale Instagram nie ma rezerwacji: trzeba pisać DM, dzwonić albo szukać zewnętrznej strony.
- **Rezerwacja** dzieje się na platformach transakcyjnych (Booksy, Treatwell) — brzydkich, przeładowanych formularzami i wymagających rejestracji, zanim w ogóle można cokolwiek obejrzeć.

**Efekt:** przerwana podróż użytkownika. Widzisz fryzurę, która Ci się podoba, i tracisz impet przy przejściu od inspiracji do umówienia wizyty.

**Drugorzędny problem:** salony nie mają własnego kanału, który jest jednocześnie wizualny i umożliwia rezerwację. Płacą Instagramowi za zasięg, a Booksy za rezerwacje. Beautify łączy oba w jednym miejscu.

### Jak architektura produktu koduje rozwiązanie
- **Feed-first, nie search-first** — odkrywanie jest emocjonalne, nie transakcyjne.
- **Anonimowe przeglądanie aż do wyboru terminu** — zaangażowanie ma być zasłużone.
- **Autentykacja tylko przez telefon** — formularz rejestracji = utrata połowy użytkowników.
- **Tap-to-book na postach feedu** — rezerwacja dzieje się wewnątrz momentu inspiracji.

---

## 3. Cele i kryteria sukcesu

### Główne kryterium sukcesu
> Użytkownik bez konta może otworzyć aplikację, znaleźć salon, który mu się podoba, i zarezerwować wizytę **w mniej niż 2 minuty** — z szybkim założeniem konta tuż przed rezerwacją.

### Sposób pomiaru
- **Testy z użytkownikami** (jakościowo): obserwacja realizacji pełnej ścieżki w < 2 min.
- **Analityka in-app** (ilościowo): lejek zdarzeń i mediana czasu do rezerwacji.

### Gwiazda polarna (North Star)
**% sesji zakończonych rezerwacją** (feed → booking).

### Metryki wspierające
- Mediana czasu od otwarcia aplikacji do utworzenia rezerwacji.
- Wskaźnik porzucenia na ekranie SMS.
- Konwersja krok po kroku: `feed_view → post_open → service_select → slot_select → phone_submit → booking_created → booking_confirmed`.

---

## 4. Użytkownicy i role

Wszyscy użytkownicy są **nietechniczni**, przyzwyczajeni do korzystania ze smartfona.

| Rola | Opis |
|------|------|
| **Klient** | Rola domyślna. Odkrywa feed, rezerwuje wizyty, zarządza swoimi rezerwacjami. |
| **Salon** | Rola opcjonalna, włączana z menu. Zarządza profilem, dostępnością, postami i przychodzącymi rezerwacjami. |

**Model konta:**
- Jeden numer telefonu = jedno konto, które może mieć **obie role jednocześnie**.
- Rejestracja domyślnie jako **klient** (numer + imię i nazwisko zbierane tuż przed pierwszą rezerwacją).
- Przełączenie/„Zostań salonem" ukryte w menu (Profile) → uruchamia kreator onboardingu salonu.
- Dane klienta są zachowane przy dodaniu roli salonu; dobierane są jedynie dodatkowe niezbędne informacje.
- Sesja po weryfikacji SMS oparta o **JWT**: krótkożyjący `access_token` + długożyjący `refresh_token` (`POST /accounts/token/refresh/`) — efektywnie utrzymuje zalogowanie przez miesiące.

---

## 5. Zakres MVP

### 5.1 Nawigacja (dolny pasek zakładek)

Zgodnie z mockupem aplikacja ma 4 zakładki:

| Zakładka | Funkcja |
|----------|---------|
| **Explore** | Wizualny feed (siatka zdjęć), filtrowany po mieście **i kategorii** (`post_type`: hair / makeup / nails / skin), pasek „Search inspiration", infinite scroll. |
| **Find** | Filtrowane przeglądanie po mieście i kategorii, wybór i zmiana miasta. Pełnotekstowe wyszukiwanie po nazwie **poza MVP** (backend nie ma endpointu). |
| **Wizyty** | „Moje wizyty" (klient) — lista rezerwacji klienta podzielona na **nadchodzące** i **minione**. Zarządzanie przychodzącymi rezerwacjami (salon) to osobny widok tej samej zakładki (rozgałęzienie po roli). Route id pozostaje `calendar` (zachowuje deep-link z ekranu potwierdzenia). |
| **Profile** | Profil, przełączanie roli / wejście w tryb salonu, wylogowanie, minimalne ustawienia. |

### 5.2 Funkcjonalności — strona KLIENTA

1. **Wybór miasta** — ustawia kontekst feedu (w nagłówku Explore / w zakładce Find). Endpoint: `GET /feed/posts/city_feed/?city=...&post_type=...`.
2. **Feed (Explore)** — przewijalna **siatka pojedynczych postów** w stylu Instagram/Pinterest, sortowana chronologicznie (najnowsze pierwsze), filtrowana po mieście salonu **i kategorii** (`post_type`), infinite scroll z paginacją (`page`, `page_size`).
3. **Szczegóły posta / salonu** — podgląd pracy + informacje o salonie + opcjonalna informacja o pracowniku + CTA „Zarezerwuj".
4. **Tap-to-book** — tapnięcie posta prowadzi do listy usług salonu z **usługą z posta wstępnie zaznaczoną** (jeśli przypisana), w pełni edytowalną. Jeśli post nie ma przypisanej usługi — pełna lista bez preselekcji.
5. **Wybór usługi** — usługa ma własny **czas trwania** (i opcjonalną cenę).
6. **Wybór pracownika** — kolejność: **usługa → pracownik**. W MVP każdy pracownik wykonuje każdą usługę.
7. **Kalendarz dostępności** — wybór daty + siatka slotów (`GET /bookings/availability/`). Dostępne sloty zależą od czasu trwania wybranej usługi. Opcjonalnie **hold slotu** (`POST /bookings/holds/`, wygasa po 5 min) chroni termin podczas wpisywania kodu SMS.
8. **Wprowadzenie telefonu + imienia i nazwiska** — pierwszy ekran autentykacji, tuż przed rezerwacją (`POST /accounts/auth/phone/initiate/`).
9. **Wprowadzenie kodu SMS** — weryfikacja numeru (`POST /accounts/auth/phone/verify/` → JWT).
10. **Potwierdzenie rezerwacji** — data, godzina, salon, usługa. Status `PENDING`; przy akceptacji ręcznej ekran: „Prośba wysłana — czekaj na potwierdzenie".
11. **Moje wizyty (zakładka „Wizyty")** — lista rezerwacji klienta podzielona wizualnie na **nadchodzące** (`PENDING`/`CONFIRMED`) i **minione** (`COMPLETED`/`CANCELLED` lub po czasie), z czytelnym oznaczeniem statusu. Dla nadchodzących: **anulowanie** oraz **zmiana terminu (reschedule)** zgodnie z polityką salonu. Czas każdej wizyty renderowany w strefie czasowej salonu. **Uwaga:** anulowanie zalogowanego klienta wymaga potwierdzenia/dorobienia mobilnego endpointu (`POST /bookings/{id}/cancel/`) — dziś dostępne jest tylko anulowanie anonimowe po tokenie (sekcja 11).

### 5.3 Funkcjonalności — strona SALONU

> Wszystkie operacje salonu są dostępne na backendzie jako mobilne endpointy (JWT + rola `owner`/`staff`), więc realizujemy je w aplikacji, a nie tylko w Django admin.

12. **Onboarding salonu (kreator, 3 ekrany):** (`POST /salons/salons/`)
    - Ekran 1 — dane salonu: nazwa, miasto, adres.
    - Ekran 2 — godziny pracy (`POST /salons/business-hours/` lub `setup_default_hours/`) + ziarno gridu slotów + ustawienie akceptacji (auto/ręczna).
    - Ekran 3 — usługi (`POST /salons/services/`): nazwa, czas trwania, cena (opcjonalna).
    - Kroki opcjonalne: dodanie pracowników, dodanie pierwszego posta („teraz / później").
13. **Ustawienie dostępności** — godziny pracy salonu, długość/ziarno slotów (wspólne dla całego salonu; w MVP wszyscy pracownicy pracują w godzinach salonu). Backend wspiera też wyjątki w grafiku (`POST /salons/schedule-exceptions/`) — wykorzystamy je w Fazie 1.5.
14. **Zarządzanie usługami** — nazwa, czas trwania, cena opcjonalna.
15. **Zarządzanie pracownikami** — prosta lista (imię + zdjęcie), używana do preselekcji na poście i kroku „wybór pracownika".
16. **Dodawanie postów (feed upload)** — `POST /feed/posts/` + upload zdjęcia (`/feed/posts/upload_image/` multipart lub `get_upload_url/` presigned S3); opcjonalne powiązanie z usługą, pracownikiem i kategorią (`post_type`).
17. **Zarządzanie rezerwacjami (Calendar)** — lista przychodzących rezerwacji; akceptacja / anulowanie. **Uwaga:** mobilny endpoint akceptacji `PENDING → CONFIRMED` po stronie salonu wymaga weryfikacji/dorobienia — patrz sekcja 11.

### 5.4 Logika rezerwacji

**Stany rezerwacji (zgodne z backendem):** `PENDING` → `CONFIRMED` → `COMPLETED`, oraz `CANCELLED` (odrzucenie przez salon = anulowanie). Brak osobnego stanu „rejected".

- Salon ma ustawienie **auto-akceptacja TAK/NIE**.
- **Auto:** rezerwacja od razu `CONFIRMED`.
- **Ręczna:** rezerwacja `PENDING`, slot **tymczasowo zablokowany** (mechanizm hold), ekran klienta: „Prośba wysłana".
- **Anti-abuse:** nowy/niezweryfikowany historycznie klient trafia **automatycznie do akceptacji ręcznej**, nawet jeśli salon ma auto-akceptację.
- **Anulowanie (symetryczne):** klient anuluje ze swojej listy (zwalnia slot); salon anuluje/odrzuca (`PENDING` lub `CONFIRMED`) z powiadomieniem. **Polityka anulowania jest egzekwowana przez backend** (konfigurowalne wyprzedzenie, np. `notice_hours: 24` — błąd przy próbie anulowania w oknie blokady), a nie „bez ograniczeń czasowych".
- **Reschedule:** backend wspiera przekładanie terminu (`POST /bookings/reschedule/`, wymagane wyprzedzenie ~2 h) — **włączone w MVP po stronie klienta** (akcja „Zmień termin" w zakładce „Wizyty", ponownie wykorzystuje ekran wyboru terminu). Zależne od potwierdzenia payloadu endpointu (sekcja 11).

### 5.5 Sloty czasowe

- Salon definiuje **godziny pracy** + **ziarno gridu** (np. co 15/30 min).
- Każda **usługa ma czas trwania**; wybrana usługa rezerwuje tyle kolejnych jednostek gridu, ile wynosi jej czas.
- Sloty wspólne dla całego salonu (wszyscy pracownicy = te same godziny). Dostępność per pracownik **poza zakresem MVP**.

### 5.6 Powiadomienia

- **Kanał:** push (FCM) jako podstawa + SMS dla krytycznych zdarzeń klienta (fallback). Backend gotowy: rejestracja tokenów urządzeń (`/accounts/device-tokens/register`) i preferencje powiadomień (`/accounts/notifications/preferences/`).
- **Wyzwalacze:**
  - Nowa rezerwacja → push do **salonu**.
  - Potwierdzenie/odrzucenie rezerwacji → powiadomienie do **klienta** (push + SMS).
- **Przypomnienie 24h przed wizytą** (push do klienta) → **Faza 1.5** (wymaga zaplanowanych zadań).

---

## 6. Poza zakresem MVP

> Część poniższych funkcji jest już wspierana przez backend (oceny, save/ulubione, waitlist, wyjątki w grafiku), ale **świadomie pomijamy je w UI MVP** — decyzja produktowa, nie ograniczenie techniczne.

- Płatności.
- Oceny i recenzje *(backend: `/salons/reviews/` — UI poza MVP)*.
- Ulubione / zapisane salony *(backend: `/feed/posts/{id}/save/` — UI poza MVP)*.
- Waitlist przy braku slotów *(backend: `/bookings/join_waitlist/` — UI poza MVP)*.
- Dostępność per pracownik / wyjątki w grafiku *(backend: `schedule-exceptions` — UI w Fazie 1.5)*.
- Mapowanie usługa ↔ konkretni pracownicy (w MVP każdy robi wszystko).
- Moderacja treści (publikacja od razu) → kandydat na Fazę 1.5.
- Pełnotekstowe wyszukiwanie po nazwie (brak endpointu) → tylko filtrowane przeglądanie.
- Tłumaczenia treści (i18n tylko setup, treści po polsku).
- Przypomnienie push 24h przed wizytą → Faza 1.5.
- Rozbudowane ustawienia.

---

## 7. Historie użytkownika (kluczowe)

**Klient**
- Jako użytkownik bez konta chcę przeglądać feed inspiracji w moim mieście, aby znaleźć salon, którego prace mi się podobają.
- Jako użytkownik chcę tapnąć w post i od razu zobaczyć usługi salonu z preselekcją usługi ze zdjęcia, aby szybko przejść do rezerwacji.
- Jako użytkownik chcę wybrać usługę, pracownika i wolny termin bez zakładania konta, aby nie tracić impetu.
- Jako użytkownik chcę podać numer i imię, potwierdzić kodem SMS i otrzymać potwierdzenie rezerwacji w mniej niż 2 minuty.
- Jako użytkownik chcę zobaczyć i anulować moje rezerwacje w jednym miejscu.

**Salon**
- Jako właściciel salonu chcę przełączyć się w tryb salonu i skonfigurować profil, godziny pracy i usługi w prostym kreatorze.
- Jako salon chcę publikować zdjęcia moich prac, aby pojawiać się w feedzie miasta.
- Jako salon chcę dostawać powiadomienie o nowej rezerwacji i akceptować/odrzucać ją (lub mieć auto-akceptację).
- Jako salon chcę widzieć listę nadchodzących rezerwacji.

---

## 8. Wymagania techniczne i decyzje

| Obszar | Decyzja |
|--------|---------|
| **Mobile** | React Native + Expo Router (iOS + Android), jedna aplikacja dla obu ról. Stack: TanStack Query (server-state), LegendList (listy/feed), Reanimated (animacje), i18next (i18n). |
| **Backend** | Django REST Framework — gotowy i produkcyjny; mobile konsumuje istniejące API. |
| **Autentykacja** | Tylko telefon + kod SMS; **JWT access + refresh**, tokeny w secure storage (keychain). |
| **i18n** | i18next — setup z domyślnym PL, bez tłumaczeń treści. |
| **Push** | FCM — backend gotowy (rejestracja device-tokenów + preferencje). |
| **SMS** | Po stronie backendu; w mobile tylko inicjacja/weryfikacja. Koszt/deliverability jako ryzyko backendowe. |
| **Storage zdjęć** | **Istniejący backend S3** — endpointy `/media/upload/` (multipart) i presigned URL. Bez potrzeby osobnej integracji Cloudinary. |
| **Analityka** | Darmowe rozwiązanie bez kosztów — preferowany PostHog free tier lub Firebase Analytics; lejek zdarzeń od dnia 1. |
| **Feed** | `city_feed` — chronologicznie (najnowsze), filtr po mieście + kategorii (`post_type`), paginacja (`page`/`page_size`). |
| **Format danych** | Telefon w E.164 (`+48...`), czasy ISO 8601 (UTC), wyświetlanie w strefie czasowej salonu. |

### Anti-abuse (minimalnie)
- Limit aktywnych rezerwacji (`PENDING`/`CONFIRMED`) na numer telefonu (np. 3).
- Rate-limit wysyłki kodów SMS na numer/IP (backend zwraca `429`; mobile robi backoff).
- Nowi klienci → automatyczna akceptacja ręczna przez salon.

---

## 9. Ryzyka i wyzwania

| Ryzyko | Wpływ | Mitygacja |
|--------|-------|-----------|
| **Cold start treści** (pusty feed na starcie) | Krytyczny — produkt feed-first bez treści nie działa | Ręczne seedowanie 1–2 miast i kilkunastu salonów z realnymi zdjęciami (zadanie operacyjne). |
| **Koszt i deliverability SMS** | Wysoki | Rate-limit, dobór dostawcy, SMS tylko dla krytycznych zdarzeń. |
| **Spam / fałszywe rezerwacje** (brak płatności) | Średni | Limit rezerwacji na numer + akceptacja ręczna dla nowych. |
| **Mały zespół (2 os.) vs rozrośnięty zakres** | Wysoki | Twarde fazowanie (Faza 1 / 1.5), pragmatyczna priorytetyzacja. |
| **Brak moderacji treści** | Średni | Świadoma akceptacja na MVP; moderacja w Fazie 1.5. |
| **Pusty stan miasta** | Niski/Średni | Komunikat „Wkrótce w Twoim mieście" + podgląd innego miasta. |

---

## 10. Plan fazowania

### Faza 1 (rdzeń MVP)
- Pełny lejek klienta: feed (Explore) → post/salon → usługa → pracownik → sloty → telefon+imię → SMS → potwierdzenie.
- Wybór/zmiana miasta (Find), wyszukiwanie podstawowe.
- Moje wizyty (zakładka „Wizyty", klient): podział nadchodzące/minione, anulowanie i zmiana terminu; opcjonalnie hold slotu.
- Tryb salonu: onboarding (kreator), dostępność salonu, usługi, pracownicy, upload postów (istniejące endpointy owner/staff).
- Zarządzanie rezerwacjami (akceptacja auto/ręczna, anulowanie) — **zależne od potwierdzenia endpointu akceptacji, sekcja 11**.
- Powiadomienia transakcyjne (push + SMS dla krytycznych zdarzeń).
- i18n setup (PL), analityka i lejek zdarzeń, anti-abuse.

### Faza 1.5 (zaraz po)
- Przypomnienie push 24h przed wizytą (zaplanowane zadania).
- Dostępność per pracownik.
- Mapowanie usługa ↔ pracownicy.
- Moderacja treści.
- Tłumaczenia treści (rozszerzenie i18n).

---

## 11. Otwarte kwestie do potwierdzenia w trakcie realizacji
- **[Backend] Akceptacja rezerwacji przez salon** — czy istnieje mobilny endpoint `PENDING → CONFIRMED` po stronie salonu oraz flaga „auto-accept" na salonie? W obecnym API widać status „confirmed by salon", ale nie potwierdzono endpointu/ustawienia. Może wymagać dorobienia. **Blokuje** logikę z sekcji 5.4.
- **[Backend] Anulowanie przez zalogowanego klienta** — brak potwierdzonego mobilnego endpointu (oczekiwany `POST /bookings/{id}/cancel/`, egzekwujący politykę wyprzedzenia); dziś istnieje tylko `cancel_anonymous/` po tokenie, którego zalogowany obiekt `Booking` nie niesie. **Blokuje** akcję „Anuluj" w zakładce „Wizyty".
- **[Backend] Reschedule — payload** — `POST /bookings/reschedule/` jest wymieniony (sekcja 12), ale wymaga potwierdzenia dokładnego payloadu (`booking` id + nowy `start_time`/slot) i reguły wyprzedzenia. **Blokuje** akcję „Zmień termin".
- **[Backend] Zakres `GET /bookings/`** — potwierdzić, że zwraca **zarówno nadchodzące, jak i minione** wizyty (w tym `COMPLETED`/`CANCELLED`); jeśli filtruje do aktywnych, sekcja „Minione" będzie wymagać osobnego zapytania/parametru.
- Ostateczny wybór narzędzia analitycznego (PostHog vs Firebase) — kryterium: brak kosztu.
- Dokładne ziarno gridu slotów (domyślnie 15 lub 30 min) — jak konfigurowane na backendzie.
- Wartość limitu aktywnych rezerwacji na numer (start: 3) — gdzie egzekwowane (backend vs mobile).
- Czy w MVP włączamy **hold slotów**, **reschedule** (oba gotowe w API) — rekomendacja: tak dla hold (chroni przed kolizją w trakcie SMS).
- Dostawca SMS — po stronie backendu; potwierdzić koszt/deliverability w PL.

---

## 12. Zgodność z backendem (mapowanie funkcja → endpoint)

Wszystkie funkcje MVP mają pokrycie w istniejącym API (`MOBILE_QUICK_REFERENCE.md`, `API_DOCUMENTATION.md`):

| Funkcja MVP | Endpoint(y) | Uwagi |
|---|---|---|
| Logowanie SMS | `POST /accounts/auth/phone/initiate/`, `.../verify/` | Zwraca JWT + `created` (nowy/istniejący) |
| Odświeżanie sesji | `POST /accounts/token/refresh/` | |
| Profil | `GET/PATCH /accounts/me/` | `phone, email, first_name, last_name, role` |
| Feed (Explore) | `GET /feed/posts/city_feed/?city=&post_type=&page=` | + `nearby_feed/` (geo) |
| Szczegóły posta + opcje bookingu | `GET /feed/posts/{id}/`, `/salon_booking/` | usługi, staff, helper endpoints |
| Dane salonu | `GET /salons/salons/{id}/`, `/services/`, `/staff/`, `/business-hours/` | |
| Dostępność + sloty | `GET /bookings/availability/?salon=&service=&staff=&date=` | |
| Hold slotu | `POST /bookings/holds/` | wygasa po 5 min |
| Rezerwacja (zalogowany) | `POST /bookings/` | po SMS/JWT |
| Moje rezerwacje | `GET /bookings/` | statusy PENDING/CONFIRMED/... |
| Anulowanie / reschedule | `POST /bookings/cancel_anonymous/`, `/reschedule/` | egzekwuje politykę wyprzedzenia |
| Onboarding salonu | `POST /salons/salons/`, `setup_default_hours/` | rola owner |
| Usługi / godziny / wyjątki | `POST /salons/services/`, `/business-hours/`, `/schedule-exceptions/` | rola owner |
| Tworzenie postów | `POST /feed/posts/` (+ `upload_image/` / `get_upload_url/`) | rola owner/staff |
| Push | `POST /accounts/device-tokens/register/`, `/notifications/preferences/` | FCM |

**Tryb testowy (DEBUG):** numery `+4811111111`…`+4855555555` z kodami `1111`…`5555` (klienci + staff) — przydatne do testów lejka bez realnego SMS.
