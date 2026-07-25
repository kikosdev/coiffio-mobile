# salon-mobile

**BLACK BOX** — the mobile app for the Coiffio platform. Separate dark sub-brand for clients, staff, and owners. Built with Expo SDK 56 / Expo Router.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 56 |
| Navigation | Expo Router (file-based, tab groups) |
| State | Zustand 5 |
| HTTP | Fetch wrapper in `src/api/client.ts` |
| Auth tokens | expo-secure-store |
| Date / time | date-fns, date-fns-tz (`Africa/Tunis`) |
| Icons | lucide-react-native |
| Animations | react-native-reanimated |
| SVG | react-native-svg |
| Gradients | expo-linear-gradient |
| Images | expo-image-picker |
| Calendar | expo-calendar (optional Add to calendar action) |

---

## Running locally

```bash
cd coiffio-mobile
npm install
npx expo start         # Opens Expo Go / dev client
```

### Environment variable

Set `EXPO_PUBLIC_API_URL` to point to the backend:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api   # local network IP for a physical device
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api       # Android emulator → host machine
```

Run Expo from a shell where that variable is loaded; otherwise the bundle falls back to `https://coif-backend.onrender.com/api`.

`expo-calendar` must be installed before bundling the calendar action:

```bash
npx expo install expo-calendar
```

---

## API coverage

The app is API-wired for auth, public marketplace/search, booking, client appointments, staff Today/Schedule, owner HQ, notifications, payments/POS surfaces, and profile/security actions.

| Surface | Main API |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register/client`, `GET/PATCH /auth/me` |
| Booking flow | `GET /book/services`, `GET /availability/timeline`, `POST /appointments` |
| Client appointments | `GET /appointments/mine`, `GET /client/home` |
| Staff Today | `GET /staff/today` + Socket.io refresh + focused polling fallback |
| Staff Schedule | `GET /staff/schedule/week` |
| Owner HQ | `GET /owner/hq` |
| Marketplace | `GET /services/categories`, `/services/search`, `/services/offerings` |
| Account/privacy | `PATCH /auth/me/deactivate`, `GET /config/public` |

---

## Route structure

Entry point: `app/_layout.tsx` — hydrates auth from SecureStore, then redirects to the correct role group.

```
app/
  (auth)/
    login.tsx          Sign in (+ "Continue as guest" for client role)
    create-account.tsx Register
  (client)/            Tabs: Home · Search · Bookings · Offers · Profile
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
| `client` | `(client)` | Home · Search · Bookings · Offers · Profile |

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
- Fetch wrapper pointing at `EXPO_PUBLIC_API_URL`
- Bearer token is injected from the in-memory auth token restored from `expo-secure-store`
- Responses unwrap the backend `{ data, message }` envelope
- Requests time out after 60 seconds to tolerate Render cold starts

---

## Auth store

`src/stores/auth.ts` — `useAuthStore()`:
- `login(identifier, password)` → hits API, calls `setSession(token, user)`
- `registerClient(...)` → creates a client account and stores the JWT
- `hydrate()` → restores token from SecureStore and calls `/auth/me`
- `deactivateAccount()` → calls `/auth/me/deactivate`, clears token, signs out locally
- `updateExpoPushToken()` → stores or clears the current user's Expo push token
- `logout()` → clears SecureStore and resets state

---

## Format utilities

| Function | Description |
|---|---|
| `formatMoney(amount)` | TND with 3 decimal places |
| `formatSalonTime(date)` | `HH:mm` in Africa/Tunis timezone |
| `salonDateKey(date)` | `YYYY-MM-DD` in the salon clock |

---

## Design reference

Based on Claude Design mockup (`BLACK BOX - Barber App.dc.html`). Three design files:
- Client screens: `Black Box - Barber App.dc.html`
- Staff screens: `Black Box Pro - Barber.dc.html`
- Owner screens: `Black Box HQ - Owner.dc.html`

Multi-location (owner Salons List, New Location) is shown as a **LockedTeaser** — not functional in V1.

---

## Notes

- The client Offers tab and `app/(client)/offers.tsx` are intentionally kept.
- Add to calendar is user-triggered from the booking confirmation screen; bookings are stored in the backend schedule at creation time.
- Expo push delivery still requires adding `expo-notifications` and a sending worker/service; backend token storage is available at `/auth/me/push-token`.
