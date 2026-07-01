import { create } from 'zustand';
import { dummyServices } from '../data/dummy';
import type { Pack } from '../data/dummy';
import type { BookedAppointment } from '../api/booking';

export type DraftService = {
  id: string;
  name: string;
  desc: string;
  durationMin: number;
  price: number; // TND
};

export interface GuestContact {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

const EMPTY_CONTACT: GuestContact = { firstName: '', lastName: '', phone: '', email: '' };

// Dev-only trip wire: every id that reaches the booking draft must be a real Mongo _id —
// mock ids (src/data/dummy.ts) slipping in here is exactly the bug class this app keeps hitting.
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
function warnIfNotObjectId(label: string, id: string): void {
  if (__DEV__ && id && !OBJECT_ID_RE.test(id)) {
    console.warn(`[bookingDraft] ${label} doesn't look like a real ObjectId: "${id}"`);
  }
}

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
  slotStartISO: string | null;
  contact: GuestContact;
  result: BookedAppointment | null;
  promo: { code: string; discount: number } | null;
  pendingPromoCode: string | null;

  // actions
  init(salonId: string, barberId: string, names: { barberName: string; salonName: string }): void;
  setStylist(barberId: string, barberName: string): void;
  addService(s: DraftService): void;
  removeService(id: string): void;
  setSlot(date: string, time: string, startISO: string): void;
  setContact(patch: Partial<GuestContact>): void;
  setResult(result: BookedAppointment | null): void;
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
  slotStartISO: null,
  contact: { ...EMPTY_CONTACT },
  result: null,
  promo: null,
  pendingPromoCode: null,

  init: (salonId, barberId, names) => {
    warnIfNotObjectId('salonId', salonId);
    warnIfNotObjectId('barberId', barberId);
    set({
      salonId, barberId, barberName: names.barberName, salonName: names.salonName,
      services: [], pack: null, date: null, time: null, slotStartISO: null,
      contact: { ...EMPTY_CONTACT }, result: null, promo: null,
    });
  },

  setStylist: (barberId, barberName) => {
    warnIfNotObjectId('barberId', barberId);
    set({ barberId, barberName, date: null, time: null, slotStartISO: null });
  },

  addService: (s) => {
    warnIfNotObjectId('service.id', s.id);
    set((state) => ({
      services: state.services.find((x) => x.id === s.id)
        ? state.services
        : [...state.services, s],
    }));
  },

  removeService: (id) =>
    set((state) => ({ services: state.services.filter((s) => s.id !== id) })),

  setSlot: (date, time, startISO) => set({ date, time, slotStartISO: startISO }),

  setContact: (patch) => set((state) => ({ contact: { ...state.contact, ...patch } })),

  setResult: (result) => set({ result }),

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
    set({
      salonId: null, barberId: null, barberName: '', salonName: '', services: [], pack: null,
      date: null, time: null, slotStartISO: null, contact: { ...EMPTY_CONTACT }, result: null,
      promo: null, pendingPromoCode: null,
    }),

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
