import { create } from 'zustand';
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
// a non-ObjectId id slipping in here is exactly the bug class this app keeps hitting.
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
function warnIfNotObjectId(label: string, id: string): void {
  if (__DEV__ && id && !OBJECT_ID_RE.test(id)) {
    console.warn(`[bookingDraft] ${label} doesn't look like a real ObjectId: "${id}"`);
  }
}

interface BookingDraft {
  salonId: string | null;
  barberId: string | null;
  barberName: string;
  salonName: string;
  services: DraftService[];
  date: string | null;
  time: string | null;
  slotStartISO: string | null;
  contact: GuestContact;
  result: BookedAppointment | null;

  // actions
  init(salonId: string, barberId: string, names: { barberName: string; salonName: string }): void;
  setStylist(barberId: string, barberName: string): void;
  addService(s: DraftService): void;
  removeService(id: string): void;
  setSlot(date: string, time: string, startISO: string): void;
  setContact(patch: Partial<GuestContact>): void;
  setResult(result: BookedAppointment | null): void;
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
  date: null,
  time: null,
  slotStartISO: null,
  contact: { ...EMPTY_CONTACT },
  result: null,

  init: (salonId, barberId, names) => {
    warnIfNotObjectId('salonId', salonId);
    warnIfNotObjectId('barberId', barberId);
    set({
      salonId, barberId, barberName: names.barberName, salonName: names.salonName,
      services: [], date: null, time: null, slotStartISO: null,
      contact: { ...EMPTY_CONTACT }, result: null,
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

  reset: () =>
    set({
      salonId: null, barberId: null, barberName: '', salonName: '', services: [],
      date: null, time: null, slotStartISO: null, contact: { ...EMPTY_CONTACT }, result: null,
    }),

  totalDurationMin: () => get().services.reduce((sum, s) => sum + s.durationMin, 0),

  servicesSubtotal: () => get().services.reduce((sum, s) => sum + s.price, 0),

  bookingFee: () => 0, // V1 cash agency — no fee

  total: () => get().servicesSubtotal() + get().bookingFee(),
}));
