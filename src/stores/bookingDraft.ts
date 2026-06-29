import { create } from 'zustand';
import { dummyServices } from '../data/dummy';
import type { Pack } from '../data/dummy';

export type DraftService = {
  id: string;
  name: string;
  desc: string;
  durationMin: number;
  price: number; // TND
};

const PROMO_CODES: Record<string, { type: 'percent' | 'fixed'; value: number }> = {
  FRESH:  { type: 'percent', value: 30 },
  FRIEND: { type: 'percent', value: 15 },
  VIP:    { type: 'fixed',   value: 10 },
};

interface BookingDraft {
  salonId: string | null;
  barberId: string | null;
  barberName: string;
  salonName: string;
  services: DraftService[];
  pack: Pack | null;
  date: string | null;
  time: string | null;
  promo: { code: string; discount: number } | null;
  pendingPromoCode: string | null;

  // actions
  init(salonId: string, barberId: string, names: { barberName: string; salonName: string }): void;
  addService(s: DraftService): void;
  removeService(id: string): void;
  setSlot(date: string, time: string): void;
  applyPromo(code: string): { ok: boolean; message?: string };
  clearPromo(): void;
  applyPack(p: Pack): void;
  removePack(): void;
  setPendingPromo(code: string): void;
  reset(): void;

  // selectors
  totalDurationMin(): number;
  servicesSubtotal(): number;
  bookingFee(): number;
  total(): number;
}

export const useBookingDraft = create<BookingDraft>()((set, get) => ({
  salonId: null,
  barberId: null,
  barberName: '',
  salonName: '',
  services: [],
  pack: null,
  date: null,
  time: null,
  promo: null,
  pendingPromoCode: null,

  init: (salonId, barberId, names) =>
    set({ salonId, barberId, barberName: names.barberName, salonName: names.salonName, services: [], pack: null, date: null, time: null, promo: null }),

  addService: (s) =>
    set((state) => ({
      services: state.services.find((x) => x.id === s.id)
        ? state.services
        : [...state.services, s],
    })),

  removeService: (id) =>
    set((state) => ({ services: state.services.filter((s) => s.id !== id) })),

  setSlot: (date, time) => set({ date, time }),

  applyPromo: (code) => {
    const upper = code.trim().toUpperCase();
    const rule = PROMO_CODES[upper];
    if (!rule) return { ok: false, message: 'Invalid promo code' };
    const subtotal = get().servicesSubtotal();
    const discount =
      rule.type === 'percent' ? (subtotal * rule.value) / 100 : rule.value;
    set({ promo: { code: upper, discount: Math.round(discount * 1000) / 1000 } });
    return { ok: true };
  },

  clearPromo: () => set({ promo: null }),

  applyPack: (p) => {
    const packServices = p.serviceIds
      .map((id) => {
        const s = dummyServices.find((ds) => ds.id === id);
        if (!s) return null;
        return { id: s.id, name: s.name, desc: s.description, durationMin: s.duration, price: s.price };
      })
      .filter(Boolean) as DraftService[];
    set({ pack: p, services: packServices });
  },

  removePack: () => set({ pack: null, services: [] }),

  setPendingPromo: (code) => set({ pendingPromoCode: code }),

  reset: () =>
    set({ salonId: null, barberId: null, barberName: '', salonName: '', services: [], pack: null, date: null, time: null, promo: null, pendingPromoCode: null }),

  totalDurationMin: () => {
    const { pack, services } = get();
    if (pack) return pack.durationMin;
    return services.reduce((sum, s) => sum + s.durationMin, 0);
  },

  servicesSubtotal: () => {
    const { pack, services } = get();
    if (pack) return pack.price;
    return services.reduce((sum, s) => sum + s.price, 0);
  },

  bookingFee: () => 0, // V1 cash agency — no fee

  total: () => {
    const { promo } = get();
    const sub = get().servicesSubtotal() + get().bookingFee();
    return Math.max(0, sub - (promo?.discount ?? 0));
  },
}));
