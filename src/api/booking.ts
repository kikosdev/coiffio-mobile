import { api } from './client';

// Mirrors salon-frontend's VITE_DEFAULT_SALON_SLUG fallback — V1 is single-salon,
// getSalonBySlug() on the backend falls back to DEFAULT_SALON_ID / the sole salon anyway.
const SALON_SLUG = process.env.EXPO_PUBLIC_SALON_SLUG ?? 'salon-haire';

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
  return api.get<BookService[]>('/book/services');
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
  const team = await api.get<PublicStylist[]>(`/public/salons/${SALON_SLUG}/team`);
  return team.filter((s) => s.role === 'stylist' || s.role === 'colorist');
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

export interface CreateAppointmentDto {
  serviceIds: string[];
  stylistId: string;
  start: string; // ISO
  clientName: string;
  clientPhone: string;
  clientEmail: string;
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
  /** Signed tracking/cancel link (Décision #12) — present on online bookings. */
  manageToken?: string;
}

/**
 * POST /appointments (OptionalJwtGuard) — the same endpoint the web storefront uses for
 * both guest and signed-in bookings. The backend resolves/creates the Client by
 * (salonId, phone) server-side (merge-on-phone, Décision #10) — never pass a clientId here.
 */
export function createAppointment(dto: CreateAppointmentDto): Promise<BookedAppointment> {
  return api.post<BookedAppointment>('/appointments', dto);
}
