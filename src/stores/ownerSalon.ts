import { create } from 'zustand';
import { api, ApiError } from '../api/client';
import { salonDateKey, nowAsSalonTime } from '../utils/salonTime';
import { MySalon } from '../types/owner';

type OwnerSalonStatus = 'idle' | 'loading' | 'error' | 'ready';

interface OwnerSalonState {
  salon: MySalon | null;
  /**
   * The owner's own tenant slug, needed by the `:salonSlug`-prefixed routes (cancel, products,
   * booking catalog). Populated by `getOwnerSalonSlug()` in src/api/owner/tenant.ts, which owns
   * the resolution (`GET /owner/hq` returns no slug, so it comes from `GET /public/salons/:id`)
   * and caches it here. Replaced a hardcoded `'salon-haire'` absent from the database.
   */
  salonSlug: string | null;
  status: OwnerSalonStatus;
  error?: string;
  /**
   * GET /owner/hq — a no-op once a fetch is in flight or has already succeeded, so mounting
   * hq.tsx, salons.tsx, salon/[id].tsx and team.tsx together in the same session still issues
   * exactly one request. Call `refresh()` instead to force a real refetch (e.g. after a team
   * mutation).
   */
  fetchHQ: () => Promise<void>;
  /** Forces a fresh GET /owner/hq regardless of current status — call after any team/salon mutation. */
  refresh: () => Promise<void>;
}

async function fetchOwnerHq(): Promise<MySalon> {
  const today = salonDateKey(nowAsSalonTime());
  return api.get<MySalon>('/owner/hq', { date: today });
}

export const useOwnerSalonStore = create<OwnerSalonState>((set, get) => ({
  salon: null,
  salonSlug: null,
  status: 'idle',
  error: undefined,

  fetchHQ: async () => {
    if (get().status === 'loading' || get().status === 'ready') return;
    set({ status: 'loading', error: undefined });
    try {
      const salon = await fetchOwnerHq();
      set({ salon, status: 'ready' });
    } catch (err) {
      set({ status: 'error', error: err instanceof ApiError ? err.message : 'Could not load salon data.' });
    }
  },

  refresh: async () => {
    set({ status: 'loading', error: undefined });
    try {
      const salon = await fetchOwnerHq();
      set({ salon, status: 'ready' });
    } catch (err) {
      set({ status: 'error', error: err instanceof ApiError ? err.message : 'Could not load salon data.' });
    }
  },
}));
