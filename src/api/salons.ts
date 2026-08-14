import { api } from './client';

export interface PublicSalon {
  id: string;
  slug: string;
  name: string;
  address: string;
  coverImage: string | null;
  rating: number | null;
  isOpen: boolean | null;
}

/** GET /public/salons — discovery listing, no auth/geolocation required. */
export function listSalons(): Promise<PublicSalon[]> {
  return api.get<PublicSalon[]>('/public/salons');
}

/** GET /public/salons/:id — single salon profile card, by Mongo _id. */
export function getSalon(id: string): Promise<PublicSalon> {
  return api.get<PublicSalon>(`/public/salons/${id}`);
}

/**
 * Mongo `_id` → tenant slug, for the flows that only carry an id (rebook from history, owner
 * HQ) but need to call a `:salonSlug`-prefixed route. Returns null instead of throwing so
 * callers can show their own "couldn't start booking" message; never invents a slug.
 */
export async function resolveSalonSlug(salonId: string): Promise<string | null> {
  if (!salonId) return null;
  try {
    return (await getSalon(salonId)).slug || null;
  } catch {
    return null;
  }
}
