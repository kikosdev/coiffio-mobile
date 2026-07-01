# salon-mobile

**BLACK BOX** — the mobile app for the Coiffio platform. Separate dark sub-brand for clients, staff, and owners. Built with Expo SDK 52 / Expo Router 4.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 52 · React Native 0.76.5 |
| Navigation | Expo Router 4 (file-based, tab groups) |
| State | Zustand 5 |
| HTTP | Axios (custom client in `src/api/client.ts`) |
| Auth tokens | expo-secure-store |
| Date / time | date-fns, date-fns-tz (`Africa/Tunis`) |
| Icons | lucide-react-native |
| Animations | react-native-reanimated |
| SVG | react-native-svg |
| Gradients | expo-linear-gradient |
| Images | expo-image-picker |

---

## Running locally

```bash
cd salon-mobile
npm install
npx expo start         # Opens Expo Go / dev client
```

### Environment variable

Set `EXPO_PUBLIC_API_URL` to point to the backend:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api   # local network IP for a physical device
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api       # Android emulator → host machine
```

---

## Dummy data — what is real vs mocked

> **The sign-in and auth flows are fully wired to the real API.**  
> Most screens in S1 are still using local dummy data pending API integration.

### Real API calls (live)

| Screen | API |
|---|---|
| Login (`/(auth)/login.tsx`) | `POST /api/auth/login` |
| Create account (`/(auth)/create-account.tsx`) | `POST /api/auth/register` |
| Client home — token stored in SecureStore | `expo-secure-store` |

### Dummy data (local — no API)

All dummy/stub data lives in `src/data/`:

| File | Used by |
|---|---|
| `src/data/dummy.ts` | Client screens — salon info, barber list, services, time slots, bookings, offers |
| `src/data/staff/today.ts` | Staff Today screen — appointment queue (marked `// SWAP: GET /appointments/mine`) |
| `src/data/staff/schedule.ts` | Staff Schedule screen (marked `// SWAP: GET /schedule`) |
| `src/data/staff/earnings.ts` | Staff Earnings screen |
| `src/data/staff/clients.ts` | Staff Clients screen |
| `src/data/staff/services.ts` | Staff My Services screen |
| `src/data/staff/profile.ts` | Staff Profile screen |
| `src/data/staff/caisse.ts` | Staff Caisse (POS) screen |

All `// SWAP:` comments in the data files mark where the real API endpoint should replace the dummy export.

---

## Route structure

Entry point: `app/_layout.tsx` — hydrates auth from SecureStore, then redirects to the correct role group.

```
app/
  (auth)/
    login.tsx          Sign in (+ "Continue as guest" for client role)
    create-account.tsx Register
  (client)/            Tabs: Home · Search · Bookings · Profile
    home.tsx
    search.tsx
    bookings.tsx
    appointments/
    barber/            Barber profile
    booking/           4-step booking flow (Services → Barber → Date/Time → Confirm)
    salon/             Salon profile
    profile/
    offers.tsx
    choose-location.tsx
  (staff)/             Tabs: Today · Schedule · Caisse · Clients · Profile
    today.tsx
    schedule.tsx
    caisse.tsx
    earnings.tsx
    services.tsx
    clients/
    appointment/       Appointment detail
    profile.tsx
  (owner)/             Tabs: HQ · Caisse · Team · Analytics · Settings
    hq.tsx
    caisse.tsx
    team.tsx
    team/              Team management sub-screens
    salon/             Salon detail
    salons.tsx         Multi-location list (LockedTeaser for V1)
    analytics.tsx
    settings.tsx
```

---

## Role routing

After login, `app/_layout.tsx` reads `user.role` and calls `router.replace()` to the matching group:

| Role | Group | Tabs |
|---|---|---|
| `owner` | `(owner)` | HQ · Caisse · Team · Analytics · Settings |
| `manager` / `stylist` / `colorist` | `(staff)` | Today · Schedule · Caisse · Clients · Profile |
| `client` | `(client)` | Home · Search · Bookings · Profile |

**Guest:** Tapping "Continue as guest" on the client login screen calls `router.replace('/(client)/home')` without authenticating. No token is set.

---

## Theme system

Three-layer token system — never hardcode hex values in components.

```
src/theme/
  tokens.base.ts    Base palette + spacing + radius + typography + semantic defaults
  tokens.roles.ts   Per-role overlays (owner/staff/client, ~5 tokens each)
  ThemeProvider.tsx Context + useTheme() hook
```

Usage in components:
```tsx
const { tokens: t } = useTheme();
// t.color.gold, t.color.bgBase, t.color.textMuted, etc.
```

### Color palette (base)

| Token | Value | Usage |
|---|---|---|
| `bgBase` | `#0E0E0E` | Screen background |
| `bgSunken` | `#070707` | Deep background (device frame match) |
| `surfaceCard` | `#161616` | Card background |
| `surfaceElevated` | `#1E1E1E` | Elevated surfaces |
| `surfaceInput` | `#1A1A1A` | Input / search bar |
| `borderSubtle` | `#232323` | Card borders |
| `borderStrong` | `#2A2A2A` | Strong borders |
| `textPrimary` | `#FFFFFF` | Headings |
| `textSecondary` | `#8A8A8A` | Body muted |
| `textMuted` | `#6E6E6E` | Section labels |
| `gold` | `#F4A62A` | Primary accent (gold CTAs, active states) |
| `onGold` | `#0E0E0E` | Text on gold backgrounds |

---

## API client

`src/api/client.ts`:
- Axios instance pointing at `EXPO_PUBLIC_API_URL`
- Request interceptor reads Bearer token from `expo-secure-store` and injects `Authorization` header
- Response interceptor unwraps `{ data }` envelope
- 401 → calls `_onUnauthorized` callback (avoids circular import); registered by `authStore.ts` via `setUnauthorizedCallback()`

---

## Auth store

`src/stores/auth/` — `useAuthStore()`:
- `login(identifier, password)` → hits API, calls `setSession(token, user)`
- `setSession(token, user)` → saves to SecureStore, updates Zustand state
- `logout()` → clears SecureStore, resets state, redirects to `/(auth)/login`

---

## Format utilities (`src/lib/format.ts`)

| Function | Description |
|---|---|
| `formatMoney(amount)` | TND with 3 decimal places |
| `formatSalonTime(date)` | `HH:mm` in Africa/Tunis timezone |
| `salonDateISO(date)` | `YYYY-MM-DD` built from local getters (never `toISOString()`) |

---

## Design reference

Based on Claude Design mockup (`BLACK BOX - Barber App.dc.html`). Three design files:
- Client screens: `Black Box - Barber App.dc.html`
- Staff screens: `Black Box Pro - Barber.dc.html`
- Owner screens: `Black Box HQ - Owner.dc.html`

Multi-location (owner Salons List, New Location) is shown as a **LockedTeaser** — not functional in V1.

---

## What's next (S1 → S2)

1. Replace all `src/data/staff/*.ts` dummy exports with real API calls
2. Wire client booking flow to `POST /appointments`
3. Owner HQ screen — connect to `/api/overview`
4. Staff Today/Schedule — connect to `/api/appointments`
5. Push notifications (Expo Notifications + backend WebSocket bridge)
