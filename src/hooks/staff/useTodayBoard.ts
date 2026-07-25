import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import { salonDateKey, nowAsSalonTime } from '../../utils/salonTime';

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

async function loadBoard(date: string, stylistId: string): Promise<TodayAppointment[]> {
  const raw = await api.get<TodayAppointment[]>('/staff/today', { date, stylistId });
  return raw.sort((a, b) => a.startTime.localeCompare(b.startTime));
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
