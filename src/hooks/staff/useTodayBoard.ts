import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import { salonDateKey, formatSalonTime, nowAsSalonTime } from '../../utils/salonTime';

export type TodayState = 'waiting' | 'in_chair' | 'done';

export type TodayService = {
  name: string;
  durationMin: number;
  priceTnd: number;
};

export type TodayAppointment = {
  id: string;
  clientId: string;
  clientName: string;
  clientInitials: string;
  phone: string;
  services: { id: string; name: string; durationMin: number; priceTnd: number }[];
  startTime: string;    // 'HH:mm'
  durationMin: number;
  totalTnd: number;
  state: TodayState;
  note?: string;
  visitCount: number;
};

interface RawAppointment {
  _id: string;
  stylistId: string;
  clientId: string;
  services: string[]; // service ids
  start: string; // ISO
  end: string;
  status: 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'noshow';
  price: number;
}

interface RawService {
  _id: string;
  name: string;
  price: number;
  durationMin: number;
}

interface RawClient {
  id: string;
  name: string;
  phone: string;
  notes: string;
  visitCount: number;
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function statusToState(status: RawAppointment['status']): TodayState {
  return status === 'completed' ? 'done' : 'waiting';
}

async function loadBoard(date: string, stylistId: string): Promise<TodayAppointment[]> {
  const raw = await api.get<RawAppointment[]>('/appointments', { date, stylistId });
  const activeAppts = raw.filter((a) => a.status !== 'cancelled' && a.status !== 'noshow');
  if (activeAppts.length === 0) return [];

  const serviceIds = [...new Set(activeAppts.flatMap((a) => a.services))];
  const clientIds = [...new Set(activeAppts.map((a) => a.clientId))];

  const [services, clients] = await Promise.all([
    api.get<RawService[]>('/services'),
    Promise.all(clientIds.map((id) => api.get<RawClient>(`/clients/${id}`))),
  ]);
  const serviceById = new Map(services.map((s) => [s._id, s]));
  const clientById = new Map(clients.map((c) => [c.id, c]));

  return activeAppts
    .map((a) => {
      const client = clientById.get(a.clientId);
      const durationMin = Math.round((new Date(a.end).getTime() - new Date(a.start).getTime()) / 60000);
      return {
        id: a._id,
        clientId: a.clientId,
        clientName: client?.name ?? 'Client',
        clientInitials: initials(client?.name ?? 'Client'),
        phone: client?.phone ?? '',
        services: a.services.map((id) => {
          const s = serviceById.get(id);
          return { id, name: s?.name ?? 'Service', durationMin: s?.durationMin ?? 0, priceTnd: s?.price ?? 0 };
        }),
        startTime: formatSalonTime(a.start),
        durationMin,
        totalTnd: a.price,
        state: statusToState(a.status),
        note: client?.notes || undefined,
        visitCount: client?.visitCount ?? 0,
      };
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** The final `in_chair` → `done` transition is a real checkout (POST /payments), which also
 * flips the appointment to `completed` server-side. `waiting` → `in_chair` has no backend
 * status to persist to (enum is booked/confirmed/completed/cancelled/noshow) — local-only. */
async function checkoutAppointment(appt: TodayAppointment, stylistId: string): Promise<void> {
  await api.post('/payments', {
    appointmentId: appt.id,
    stylistId,
    items: appt.services.map((s) => ({ kind: 'service', refId: s.id, name: s.name, qty: 1, unitPrice: s.priceTnd })),
    method: 'cash',
  });
}

export function useTodayBoard() {
  const staffId = useAuthStore((s) => s.user?.staffId);
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const date = salonDateKey(nowAsSalonTime());

  const refresh = useCallback(async () => {
    if (!staffId) return;
    setIsLoading(true);
    setError(null);
    try {
      setAppointments(await loadBoard(date, staffId));
    } catch {
      setError('Could not load today’s appointments.');
    } finally {
      setIsLoading(false);
    }
  }, [date, staffId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function advanceState(id: string) {
    const appt = appointments.find((a) => a.id === id);
    if (!appt || !staffId) return;
    if (appt.state === 'waiting') {
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, state: 'in_chair' } : a)));
      return;
    }
    if (appt.state === 'in_chair') {
      await checkoutAppointment(appt, staffId);
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, state: 'done' } : a)));
    }
  }

  return { data: { date, appointments }, isLoading, error, advanceState, refresh };
}
