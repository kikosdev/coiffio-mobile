import { create } from 'zustand';
import { format } from 'date-fns';

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export type Appointment = {
  id: string;
  ref: string;
  barber: { id: string; name: string; isPro: boolean };
  salon: { name: string; distanceKm?: number };
  services: { name: string; price: number }[];
  date: string;       // 'yyyy-MM-dd'
  startTime: string;  // 'HH:mm'
  endTime: string;    // 'HH:mm'
  durationMin: number;
  status: AppointmentStatus;
  paymentMethod: 'cash';
  amountDue: number;
  checkInCode: string;
  rating?: number;
};

const MOCK: Appointment[] = [
  {
    id: 'ap1', ref: 'BB-20847',
    barber: { id: 'b1', name: 'Richard Anderson', isPro: true },
    salon: { name: 'Rogers Barbershop', distanceKm: 2.3 },
    services: [{ name: 'Classic Cut', price: 35 }, { name: 'Beard Trim', price: 20 }],
    date: '2026-07-02', startTime: '12:00', endTime: '12:45', durationMin: 45,
    status: 'confirmed', paymentMethod: 'cash', amountDue: 55, checkInCode: 'BB-20847',
  },
  {
    id: 'ap2', ref: 'BB-20932',
    barber: { id: 'b2', name: 'Marcus Lee', isPro: false },
    salon: { name: 'Rogers Barbershop', distanceKm: 2.3 },
    services: [{ name: 'Skin Fade', price: 45 }],
    date: '2026-07-08', startTime: '16:30', endTime: '17:15', durationMin: 45,
    status: 'pending', paymentMethod: 'cash', amountDue: 45, checkInCode: 'BB-20932',
  },
  {
    id: 'ap3', ref: 'BB-19284',
    barber: { id: 'b1', name: 'Richard Anderson', isPro: true },
    salon: { name: 'Rogers Barbershop', distanceKm: 2.3 },
    services: [{ name: 'Cut & Beard', price: 45 }],
    date: '2026-05-28', startTime: '11:00', endTime: '11:50', durationMin: 50,
    status: 'completed', paymentMethod: 'cash', amountDue: 45, checkInCode: 'BB-19284',
    rating: 5,
  },
  {
    id: 'ap4', ref: 'BB-18749',
    barber: { id: 'b3', name: 'Dawit Kebede', isPro: true },
    salon: { name: 'Rogers Barbershop', distanceKm: 2.3 },
    services: [{ name: 'Skin Fade', price: 32 }],
    date: '2026-04-09', startTime: '14:00', endTime: '14:45', durationMin: 45,
    status: 'completed', paymentMethod: 'cash', amountDue: 32, checkInCode: 'BB-18749',
    rating: 4,
  },
  {
    id: 'ap5', ref: 'BB-17563',
    barber: { id: 'b2', name: 'Marcus Lee', isPro: false },
    salon: { name: 'Rogers Barbershop', distanceKm: 2.3 },
    services: [{ name: 'Classic Cut', price: 35 }],
    date: '2026-03-21', startTime: '10:00', endTime: '10:30', durationMin: 30,
    status: 'completed', paymentMethod: 'cash', amountDue: 35, checkInCode: 'BB-17563',
  },
];

interface AppointmentsState {
  items: Appointment[];
  upcoming: () => Appointment[];
  history: () => Appointment[];
  byId: (id: string) => Appointment | undefined;
  totalSpentThisYear: () => number;
  completedCount: () => number;
  cancelAppointment: (id: string) => void;
  reschedule: (id: string, date: string, startTime: string, endTime: string) => void;
}

export const useAppointments = create<AppointmentsState>()((set, get) => ({
  items: MOCK,

  upcoming: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return get()
      .items.filter(
        (a) => (a.status === 'confirmed' || a.status === 'pending') && a.date >= today
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  },

  history: () =>
    get()
      .items.filter((a) => a.status === 'completed' || a.status === 'cancelled')
      .sort((a, b) => b.date.localeCompare(a.date)),

  byId: (id) => get().items.find((a) => a.id === id),

  totalSpentThisYear: () => {
    const year = new Date().getFullYear().toString();
    return get()
      .items.filter((a) => a.status === 'completed' && a.date.startsWith(year))
      .reduce((sum, a) => sum + a.amountDue, 0);
  },

  completedCount: () => get().items.filter((a) => a.status === 'completed').length,

  cancelAppointment: (id) =>
    set((s) => ({
      items: s.items.map((a) => (a.id === id ? { ...a, status: 'cancelled' as const } : a)),
    })),

  reschedule: (id, date, startTime, endTime) =>
    set((s) => ({
      items: s.items.map((a) =>
        a.id === id ? { ...a, date, startTime, endTime, status: 'confirmed' as const } : a
      ),
    })),
}));
