import { create } from 'zustand';
import { api } from '../api/client';
import { salonDateKey, formatSalonTime } from '../utils/salonTime';

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'noshow';

export type Appointment = {
  id: string;
  ref: string;
  barber: { id: string; name: string; isPro: boolean };
  salon: { name: string; distanceKm?: number };
  services: { name: string; price: number }[];
  date: string;       // 'yyyy-MM-dd' (Africa/Tunis)
  startTime: string;  // 'HH:mm' (Africa/Tunis)
  endTime: string;    // 'HH:mm' (Africa/Tunis)
  durationMin: number;
  status: AppointmentStatus;
  paymentMethod: 'cash';
  amountDue: number;
  checkInCode: string;
  rating?: number; // jamais renseigné aujourd'hui — aucune collection reviews en base
};

type RawStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'noshow';

interface RawAppointment {
  id: string;
  salonId: string;
  salonName: string | null;
  barber: { id: string | null; name: string; title: string | null; isPro: boolean; initials: string };
  services: { name: string; price: number }[];
  start: string;
  end: string;
  price: number;
  status: RawStatus;
}

// AP-1 : le statut stocké n'est jamais "pending" — c'est un label dérivé (position dans la
// liste triée). `context` gère juste le cas rare d'un RDV passé jamais clôturé par le staff.
function mapStatus(raw: RawStatus, context: 'upcoming' | 'history'): AppointmentStatus {
  if (raw === 'completed') return 'completed';
  if (raw === 'cancelled') return 'cancelled';
  if (raw === 'noshow') return 'noshow';
  return context === 'history' ? 'completed' : 'pending';
}

function transform(raw: RawAppointment, context: 'upcoming' | 'history'): Appointment {
  const durationMin = Math.round((new Date(raw.end).getTime() - new Date(raw.start).getTime()) / 60000);
  return {
    id: raw.id,
    ref: raw.id.slice(-8).toUpperCase(),
    barber: { id: raw.barber.id ?? '', name: raw.barber.name, isPro: raw.barber.isPro },
    salon: { name: raw.salonName ?? 'Salon' },
    services: raw.services,
    date: salonDateKey(raw.start),
    startTime: formatSalonTime(raw.start),
    endTime: formatSalonTime(raw.end),
    durationMin,
    status: mapStatus(raw.status, context),
    paymentMethod: 'cash',
    amountDue: raw.price,
    checkInCode: raw.id,
  };
}

interface AppointmentsState {
  upcomingItems: Appointment[];
  historyItems: Appointment[];
  loadingUpcoming: boolean;
  loadingHistory: boolean;

  fetchUpcoming: () => Promise<void>;
  fetchHistory: () => Promise<void>;

  upcoming: () => Appointment[];
  history: () => Appointment[];
  byId: (id: string) => Appointment | undefined;
  totalSpentThisYear: () => number;
  completedCount: () => number;
  cancelAppointment: (id: string) => Promise<void>;
}

export const useAppointments = create<AppointmentsState>()((set, get) => ({
  upcomingItems: [],
  historyItems: [],
  loadingUpcoming: false,
  loadingHistory: false,

  fetchUpcoming: async () => {
    set({ loadingUpcoming: true });
    try {
      const raw = await api.get<RawAppointment[]>('/appointments/mine', { scope: 'upcoming' });
      set({ upcomingItems: raw.map((a) => transform(a, 'upcoming')), loadingUpcoming: false });
    } catch {
      set({ upcomingItems: [], loadingUpcoming: false });
    }
  },

  fetchHistory: async () => {
    set({ loadingHistory: true });
    try {
      const raw = await api.get<RawAppointment[]>('/appointments/mine', { scope: 'history' });
      set({ historyItems: raw.map((a) => transform(a, 'history')), loadingHistory: false });
    } catch {
      set({ historyItems: [], loadingHistory: false });
    }
  },

  // Soonest upcoming = "confirmed" (featured) ; le reste = "pending" (AP-1 — pur affichage).
  upcoming: () => get().upcomingItems.map((a, i) => ({ ...a, status: i === 0 ? 'confirmed' : 'pending' })),

  history: () => get().historyItems,

  byId: (id) => get().upcomingItems.find((a) => a.id === id) ?? get().historyItems.find((a) => a.id === id),

  totalSpentThisYear: () => {
    const year = new Date().getFullYear().toString();
    return get()
      .historyItems.filter((a) => a.status === 'completed' && a.date.startsWith(year))
      .reduce((sum, a) => sum + a.amountDue, 0);
  },

  completedCount: () => get().historyItems.filter((a) => a.status === 'completed').length,

  cancelAppointment: async (id) => {
    await api.patch(`/appointments/${id}/cancel`);
    set((s) => ({ upcomingItems: s.upcomingItems.filter((a) => a.id !== id) }));
  },
}));
