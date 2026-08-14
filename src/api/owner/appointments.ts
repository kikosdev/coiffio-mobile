import { api } from '../client';
import { getOwnerSalonSlug } from './tenant';
import { Appointment } from '../../types/owner';

// Création : réutilise src/api/booking.ts's createAppointment() (POST /:salonSlug/appointments)
// — même endpoint que le storefront, pas de doublon ici.

export interface ListAppointmentsParams {
  date?: string; // 'YYYY-MM-DD'
  stylistId?: string;
}

/** GET /appointments — owner/manager/stylist/colorist. Only `date`/`stylistId` are filterable server-side. */
export function list(params: ListAppointmentsParams = {}): Promise<Appointment[]> {
  return api.get<Appointment[]>('/appointments', { date: params.date, stylistId: params.stylistId });
}

/** GET /appointments/:id — unhydrated: `stylistId`/`clientId`/`services` are bare ids. */
export function get(id: string): Promise<Appointment> {
  return api.get<Appointment>(`/appointments/${id}`);
}

// No generic `update(id, dto)` — the backend exposes no `PATCH /appointments/:id`. The only
// mutation on an existing appointment is the cancel route below.

/**
 * PATCH /:salonSlug/appointments/:id/cancel — staff (JWT) or a guest via a signed `?token=`
 * link. Slug-scoped like the public booking routes (see booking.ts) even for authenticated
 * staff callers; the tenant slug is resolved from real data by `getOwnerSalonSlug()`.
 */
export async function cancel(id: string): Promise<Appointment> {
  const salonSlug = await getOwnerSalonSlug();
  return api.patch<Appointment>(`/${salonSlug}/appointments/${id}/cancel`, {});
}
