import { create } from 'zustand';
import { api } from '../api/client';
import { useAuthStore } from './auth';

export interface LatestVisit {
  appointmentId: string;
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
}

interface HomeState {
  latestVisit: LatestVisit | null;
  loadingLatest: boolean;
  nearby: NearbySalon[];
  loadingNearby: boolean;
  fetchLatestVisit: () => Promise<void>;
  fetchNearby: (lat: number, lng: number, radiusKm: number) => Promise<void>;
}

export const useHomeStore = create<HomeState>((set) => ({
  latestVisit: null,
  loadingLatest: false,
  nearby: [],
  loadingNearby: false,

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

  fetchNearby: async (lat, lng, radiusKm) => {
    set({ loadingNearby: true });
    try {
      const data = await api.get<NearbySalon[]>('/salons/nearby', { lat, lng, radiusKm });
      set({ nearby: data, loadingNearby: false });
    } catch {
      set({ nearby: [], loadingNearby: false });
    }
  },
}));
