import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { TodayAppointment, TodayState } from './useTodayBoard';

interface RawAppointment {
  _id: string;
  stylistId: string;
  clientId: string;
  services: string[];
  start: string;
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

export interface AppointmentDetail extends TodayAppointment {
  stylistId: string;
  date: string; // 'yyyy-MM-dd' — this appointment's own day, not necessarily today
  start: string; // ISO
  end: string; // ISO
}

async function loadAppointment(id: string): Promise<AppointmentDetail> {
  const a = await api.get<RawAppointment>(`/appointments/${id}`);
  const [services, client] = await Promise.all([
    api.get<RawService[]>('/services'),
    api.get<RawClient>(`/clients/${a.clientId}`),
  ]);
  const serviceById = new Map(services.map((s) => [s._id, s]));
  const durationMin = Math.round((new Date(a.end).getTime() - new Date(a.start).getTime()) / 60000);

  return {
    id: a._id,
    stylistId: a.stylistId,
    clientId: a.clientId,
    clientName: client.name,
    clientInitials: initials(client.name),
    phone: client.phone,
    services: a.services.map((id) => {
      const s = serviceById.get(id);
      return { id, name: s?.name ?? 'Service', durationMin: s?.durationMin ?? 0, priceTnd: s?.price ?? 0 };
    }),
    startTime: a.start.slice(11, 16),
    durationMin,
    totalTnd: a.price,
    state: a.status === 'completed' ? 'done' : 'waiting',
    note: client.notes || undefined,
    visitCount: client.visitCount,
    date: a.start.slice(0, 10),
    start: a.start,
    end: a.end,
  };
}

export function useAppointment(id: string) {
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      setAppointment(await loadAppointment(id));
    } catch {
      setError('Could not load this appointment.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function advanceState() {
    if (!appointment) return;
    if (appointment.state === 'waiting') {
      setAppointment((a) => (a ? { ...a, state: 'in_chair' as TodayState } : a));
      return;
    }
    if (appointment.state === 'in_chair') {
      await api.post('/payments', {
        appointmentId: appointment.id,
        stylistId: appointment.stylistId,
        items: appointment.services.map((s) => ({ kind: 'service', refId: s.id, name: s.name, qty: 1, unitPrice: s.priceTnd })),
        method: 'cash',
      });
      setAppointment((a) => (a ? { ...a, state: 'done' } : a));
    }
  }

  return { data: appointment, isLoading, error, advanceState };
}
