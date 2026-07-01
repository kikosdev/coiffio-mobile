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
