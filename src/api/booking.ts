import { api } from './client';

/**
 * Every booking route on the backend is prefixed with `:salonSlug` — the tenant is resolved
 * from it via GuestScopeService, which 404s on an unknown slug rather than falling back to a
 * guessed salon. So the slug is a required argument on every function here, never an env var
 * and never a default: the previous `process.env.EXPO_PUBLIC_SALON_SLUG ?? 'salon-haire'`
 * pointed at a slug that doesn't exist in the database (and the URLs were missing the prefix
 * entirely), which is what made the whole client booking flow 404.
 *
 * Callers get the slug from the salon they actually opened — `getSalon(id).slug` on
 * `/public/salons/:id`, carried through the booking draft. Never reconstruct it from a name.
 */
const CATALOG_TTL_MS = 5 * 60 * 1000;

// Keyed by slug. A single shared variable served whichever salon was fetched first to every
// other salon's screens — the caches must never be able to cross tenants.
const catalogCache = new Map<string, { at: number; data: BookService[] }>();
const stylistCache = new Map<string, { at: number; data: PublicStylist[] }>();

/**
 * Fails loudly instead of building `/undefined/book/services`, which the backend answers with
 * a generic 404 that reads exactly like "this salon has no services" — the silent-empty
 * failure mode this module exists to prevent.
 */
function assertSlug(salonSlug: string, fn: string): void {
  if (!salonSlug) throw new Error(`[booking] ${fn}() called without a salonSlug`);
}

export interface BookService {
  _id: string;
  name: string;
  category: string;
  gender: 'men' | 'women' | 'universal';
  price: number;
  durationMin: number;
  bufferMin: number;
  color: string;
}

/** GET /:salonSlug/book/services — public bookable catalog (OptionalJwtGuard). */
export function fetchCatalog(salonSlug: string): Promise<BookService[]> {
  assertSlug(salonSlug, 'fetchCatalog');
  const hit = catalogCache.get(salonSlug);
  if (hit && Date.now() - hit.at < CATALOG_TTL_MS) {
    return Promise.resolve(hit.data);
  }
  return api.get<BookService[]>(`/${salonSlug}/book/services`).then((data) => {
    catalogCache.set(salonSlug, { at: Date.now(), data });
    return data;
  });
}

export interface PublicStylist {
  id: string;
  name: string;
  role: string;
  color: string;
  title: string;
  bio: string;
}

/** GET /public/salons/:salonSlug/team — public team directory; bookable roles filtered here. */
export async function fetchBookableStylists(salonSlug: string): Promise<PublicStylist[]> {
  assertSlug(salonSlug, 'fetchBookableStylists');
  const hit = stylistCache.get(salonSlug);
  if (hit && Date.now() - hit.at < CATALOG_TTL_MS) {
    return hit.data;
  }
  const team = await api.get<PublicStylist[]>(`/public/salons/${salonSlug}/team`);
  // owner/manager occupy no chair — only stylist/colorist are bookable (see booking.service.ts).
  const data = team.filter((s) => s.role === 'stylist' || s.role === 'colorist');
  stylistCache.set(salonSlug, { at: Date.now(), data });
  return data;
}

export interface SlotOption {
  time: string; // 'HH:mm', Africa/Tunis
  start: string; // ISO
}

export interface StylistAvailability {
  stylistId: string;
  stylistName: string;
  level?: string;
  slots: SlotOption[];
}

/** GET /:salonSlug/availability — recalculated live server-side (no cached slots). */
export function fetchAvailability(
  salonSlug: string,
  serviceIds: string[],
  date: string,
  stylistId?: string,
): Promise<StylistAvailability[]> {
  assertSlug(salonSlug, 'fetchAvailability');
  return api.get<StylistAvailability[]>(`/${salonSlug}/availability`, {
    serviceIds,
    date,
    ...(stylistId ? { stylistId } : {}),
  });
}

export interface TimelineDay {
  date: string; // 'YYYY-MM-DD'
  dayOfWeek: string;
  isClosed: boolean;
  stylists: StylistAvailability[];
}

/** GET /:salonSlug/availability/timeline — one call covers a whole visible month (max 31 days). */
export function fetchTimeline(
  salonSlug: string,
  serviceIds: string[],
  startDate: string,
  stylistId?: string,
  days?: number,
): Promise<TimelineDay[]> {
  assertSlug(salonSlug, 'fetchTimeline');
  return api.get<TimelineDay[]>(`/${salonSlug}/availability/timeline`, {
    serviceIds,
    startDate,
    ...(stylistId ? { stylistId } : {}),
    ...(days ? { days } : {}),
  });
}

/**
 * Stylist ids actually bookable for the selected services, derived from the unfiltered
 * timeline (a rolling window, not just today — a stylist off today may still be eligible).
 * Used to keep the "choose your stylist" list from offering someone who then shows zero
 * slots on every day in datetime.tsx (capability/schedule filtering happens server-side,
 * inside dayAvailability, not on the public team endpoint).
 */
export async function fetchAvailableStylistIds(
  salonSlug: string,
  serviceIds: string[],
  startDate: string,
  days = 14,
): Promise<Set<string>> {
  const timeline = await fetchTimeline(salonSlug, serviceIds, startDate, undefined, days);
  const ids = new Set<string>();
  for (const day of timeline) {
    for (const s of day.stylists) ids.add(s.stylistId);
  }
  return ids;
}

export interface CreateAppointmentDto {
  serviceIds: string[];
  stylistId: string;
  start: string; // ISO
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  /**
   * 'phone' is staff-only (backend rejects it for an unauthenticated/client caller) — the
   * owner backoffice's "New appointment" flow (src/app/(owner)/appointment/new.tsx) is the
   * one caller that should ever pass it. Omit (defaults 'online' server-side) for the public
   * storefront flow.
   */
  source?: 'online' | 'phone';
}

export type AppointmentStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'noshow';

export interface BookedAppointment {
  _id: string;
  stylistId: string;
  clientId: string;
  groupId: string;
  services: string[];
  start: string;
  end: string;
  status: AppointmentStatus;
  source: 'online' | 'walkin' | 'phone';
  price: number;
  checkInCode?: string;
  /** Signed tracking/cancel link (Décision #12) — present on online bookings. */
  manageToken?: string;
}

/**
 * POST /:salonSlug/appointments (OptionalJwtGuard) — the same endpoint the web storefront uses
 * for both guest and signed-in bookings. Guests resolve/create the Client by phone; signed-in
 * clients pass their authenticated clientId so the booking is guaranteed to appear in Mine.
 */
export function createAppointment(
  salonSlug: string,
  dto: CreateAppointmentDto,
): Promise<BookedAppointment> {
  assertSlug(salonSlug, 'createAppointment');
  return api.post<BookedAppointment>(`/${salonSlug}/appointments`, dto);
}
