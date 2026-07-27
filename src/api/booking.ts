import { api } from './client';

// Mirrors salon-frontend's VITE_DEFAULT_SALON_SLUG fallback — V1 is single-salon,
// getSalonBySlug() on the backend falls back to DEFAULT_SALON_ID / the sole salon anyway.
const SALON_SLUG = process.env.EXPO_PUBLIC_SALON_SLUG ?? 'salon-haire';
const CATALOG_TTL_MS = 5 * 60 * 1000;
let catalogCache: { at: number; data: BookService[] } | null = null;
let stylistCache: { at: number; data: PublicStylist[] } | null = null;

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

/** GET /book/services — public bookable catalog (OptionalJwtGuard, scoped server-side). */
export function fetchCatalog(): Promise<BookService[]> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) {
    return Promise.resolve(catalogCache.data);
  }
  return api.get<BookService[]>('/book/services').then((data) => {
    catalogCache = { at: Date.now(), data };
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

/** GET /public/salons/:slug/team — public team directory; filter to bookable roles client-side. */
export async function fetchBookableStylists(): Promise<PublicStylist[]> {
  if (stylistCache && Date.now() - stylistCache.at < CATALOG_TTL_MS) {
    return stylistCache.data;
  }
  const team = await api.get<PublicStylist[]>(`/public/salons/${SALON_SLUG}/team`);
  const data = team.filter((s) => s.role === 'stylist' || s.role === 'colorist');
  stylistCache = { at: Date.now(), data };
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

/** GET /availability — recalculated live server-side (no cached slots). */
export function fetchAvailability(
  serviceIds: string[],
  date: string,
  stylistId?: string,
): Promise<StylistAvailability[]> {
  return api.get<StylistAvailability[]>('/availability', {
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

/** GET /availability/timeline — one call covers a whole visible month (max 31 days). */
export function fetchTimeline(
  serviceIds: string[],
  startDate: string,
  stylistId?: string,
  days?: number,
): Promise<TimelineDay[]> {
  return api.get<TimelineDay[]>('/availability/timeline', {
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
  serviceIds: string[],
  startDate: string,
  days = 14,
): Promise<Set<string>> {
  const timeline = await fetchTimeline(serviceIds, startDate, undefined, days);
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
  source?: 'online';
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
 * POST /appointments (OptionalJwtGuard) — the same endpoint the web storefront uses for
 * both guest and signed-in bookings. Guests resolve/create the Client by phone; signed-in
 * clients pass their authenticated clientId so the booking is guaranteed to appear in Mine.
 */
export function createAppointment(dto: CreateAppointmentDto): Promise<BookedAppointment> {
  return api.post<BookedAppointment>('/appointments', dto);
}
