import { create } from 'zustand';
import { api } from '../api/client';

const SEARCH_LANDING_TTL_MS = 5 * 60 * 1000;
let searchLandingCacheAt = 0;

export interface CategoryChip {
  category: string;
  serviceCount: number;
}

export interface ServiceHit {
  name: string;
  category: string;
  durationMin: number | null;
  gender: string;
  salonCount: number;
  serviceIds?: string[];
}

export interface PublicBarber {
  staffId: string;
  salonId: string;
  salonName?: string;
  name: string;
  title: string;
  isPro: boolean;
  isAvailable: boolean;
  initials: string;
}

export interface SalonOffering {
  salonId: string;
  name: string;
  address: string;
  serviceName: string | null;
  price: number | null;
  durationMin: number | null;
  distanceKm: number | null;
  isOpen: boolean | null;
  coverImage: string | null;
}

interface SearchState {
  categories: CategoryChip[];
  hits: ServiceHit[];
  barbers: PublicBarber[];
  offerings: SalonOffering[];
  loadingLanding: boolean;
  loadingOfferings: boolean;

  fetchLanding: () => Promise<void>;
  searchServices: (q: string) => Promise<void>;
  fetchOfferings: (filter: {
    category?: string;
    categories?: string[];
    name?: string;
    names?: string[];
    serviceIds?: string[];
    match?: 'all' | 'any';
  }, lat?: number, lng?: number) => Promise<void>;
}

export const useSearchStore = create<SearchState>((set) => ({
  categories: [],
  hits: [],
  barbers: [],
  offerings: [],
  loadingLanding: false,
  loadingOfferings: false,

  fetchLanding: async () => {
    const current = useSearchStore.getState();
    if (
      current.categories.length > 0 &&
      current.barbers.length > 0 &&
      !current.loadingLanding &&
      Date.now() - searchLandingCacheAt < SEARCH_LANDING_TTL_MS
    ) {
      return;
    }
    set({ loadingLanding: true });
    try {
      const [categories, barbers] = await Promise.all([
        api.get<CategoryChip[]>('/services/categories'),
        api.get<PublicBarber[]>('/barbers/public'),
      ]);
      searchLandingCacheAt = Date.now();
      set({ categories, barbers, loadingLanding: false });
    } catch {
      set({ categories: [], barbers: [], loadingLanding: false });
    }
  },

  searchServices: async (q) => {
    if (q.trim().length < 2) {
      set({ hits: [] });
      return;
    }
    try {
      const hits = await api.get<ServiceHit[]>('/services/search', { q });
      set({ hits });
    } catch {
      set({ hits: [] });
    }
  },

  fetchOfferings: async (filter, lat, lng) => {
    set({ offerings: [], loadingOfferings: true });
    try {
      const offerings = await api.get<SalonOffering[]>('/services/offerings', {
        category: filter.category,
        categories: filter.categories,
        name: filter.name,
        names: filter.names,
        serviceIds: filter.serviceIds,
        match: filter.match,
        lat,
        lng,
      });
      set({ offerings, loadingOfferings: false });
    } catch {
      set({ offerings: [], loadingOfferings: false });
    }
  },
}));
