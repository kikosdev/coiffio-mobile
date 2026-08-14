import { create } from 'zustand';
import { api } from '../api/client';
import { useAuthStore } from './auth';
import { listSalons, type PublicSalon } from '../api/salons';

export interface LatestVisit {
  appointmentId: string;
  /** Mirrors the backend's LatestVisit — `salonSlug` is what the `:salonSlug`-prefixed booking
   *  routes need, so the "Book" tap on this card carries a real salon context. Nullable: the
   *  backend returns null rather than inventing a slug for a salon that has none. */
  salonId: string;
  salonSlug: string | null;
  barber: {
    id: string | null;
    name: string;
    avatar: string | null;
    rating: number | null;
    reviewCount: number | null;
    isPro: boolean;
  };
  lastVisitAt: string;
}

export interface NearbySalon {
  id: string;
  name: string;
  address: string;
  coverImage: string | null;
  distanceKm: number | null;
  rating: number | null;
  isOpen: boolean | null;
  lat: number | null;
  lng: number | null;
}

interface HomeState {
  latestVisit: LatestVisit | null;
  loadingLatest: boolean;
  nearby: NearbySalon[];
  loadingNearby: boolean;
  nearbyError: boolean;
  salons: PublicSalon[];
  loadingSalons: boolean;
  salonsError: boolean;
  fetchLatestVisit: () => Promise<void>;
  fetchNearby: (lat: number, lng: number, radiusKm: number) => Promise<void>;
  fetchSalons: () => Promise<void>;
}

export const useHomeStore = create<HomeState>((set) => ({
  latestVisit: null,
  loadingLatest: false,
  nearby: [],
  loadingNearby: false,
  nearbyError: false,
  salons: [],
  loadingSalons: true,
  salonsError: false,

  fetchLatestVisit: async () => {
    if (!useAuthStore.getState().user) return; // guest — section stays hidden
    set({ loadingLatest: true });
    try {
      const data = await api.get<LatestVisit | null>('/clients/me/latest-visit');
      set({ latestVisit: data, loadingLatest: false });
    } catch {
      set({ latestVisit: null, loadingLatest: false });
    }
  },

  // `nearbyError` exists so a failed request stays distinguishable from a genuine
  // "no salon within X km" — collapsing both into `nearby: []` told the user the area was
  // empty when the network was actually down.
  fetchNearby: async (lat, lng, radiusKm) => {
    set({ loadingNearby: true, nearbyError: false });
    try {
      const data = await api.get<NearbySalon[]>('/salons/nearby', { lat, lng, radiusKm });
      set({ nearby: data, loadingNearby: false });
    } catch {
      set({ nearby: [], loadingNearby: false, nearbyError: true });
    }
  },

  // Drives the list-vs-Nearby switch (SKILL_home_list_all_salons, NEARBY_THRESHOLD).
  fetchSalons: async () => {
    set({ loadingSalons: true, salonsError: false });
    try {
      const data = await listSalons();
      set({ salons: data, loadingSalons: false });
    } catch {
      set({ salons: [], loadingSalons: false, salonsError: true });
    }
  },
}));
