import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import { nowAsSalonTime } from '../../utils/salonTime';

export type ScheduleSlotState = 'confirmed' | 'completed' | 'cancelled';

export type ScheduleSlot = {
  id: string;
  date: string;           // 'yyyy-MM-dd'
  startTime: string;      // 'HH:mm'
  durationMin: number;
  clientName: string;
  clientInitials: string;
  service: string;
  priceTnd: number;
  state: ScheduleSlotState;
};

export type DayWindow = { start: string; end: string } | null; // null = not working that day

interface RawAppointment {
  _id: string;
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
}

interface RawClient {
  id: string;
  name: string;
}

interface RawWeeklyShift {
  day: number; // 0=Sun..6=Sat
  start: string;
  end: string;
}

interface RawOverride {
  date: string;
  type: 'off' | 'leave' | 'custom';
  start?: string;
  end?: string;
}

interface RawSchedule {
  weekly: RawWeeklyShift[];
  overrides: RawOverride[];
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function mondayOfThisWeek(): Date {
  const now = nowAsSalonTime(); // real Africa/Tunis "today", not the device's raw UTC day
  const dow = (now.getUTCDay() + 6) % 7; // 0=Mon
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow));
  return monday;
}

function dayWindowFor(schedule: RawSchedule, date: string, weekday: number): DayWindow {
  const override = schedule.overrides.find((o) => o.date === date);
  if (override && (override.type === 'off' || override.type === 'leave')) return null;
  if (override && override.type === 'custom' && override.start && override.end) {
    return { start: override.start, end: override.end };
  }
  const base = schedule.weekly.find((w) => w.day === weekday);
  return base ? { start: base.start, end: base.end } : null;
}

function statusToState(status: RawAppointment['status']): ScheduleSlotState | null {
  if (status === 'cancelled' || status === 'noshow') return null; // don't clutter the week view
  if (status === 'completed') return 'completed';
  return 'confirmed';
}

export function useSchedule() {
  const staffId = useAuthStore((s) => s.user?.staffId);
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [dayWindows, setDayWindows] = useState<Record<string, DayWindow>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!staffId) return;
    setIsLoading(true);
    setError(null);
    try {
      const monday = mondayOfThisWeek();
      const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
        return d.toISOString().slice(0, 10);
      });

      const [schedule, services, ...dayAppts] = await Promise.all([
        api.get<RawSchedule>(`/schedule/${staffId}`),
        api.get<RawService[]>('/services'),
        ...dates.map((date) => api.get<RawAppointment[]>('/appointments', { date, stylistId: staffId })),
      ]);
      const serviceById = new Map(services.map((s) => [s._id, s]));

      const windows: Record<string, DayWindow> = {};
      dates.forEach((date, i) => {
        const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
        windows[date] = dayWindowFor(schedule, date, weekday);
      });

      const allAppts = dayAppts.flat();
      const clientIds = [...new Set(allAppts.map((a) => a.clientId))];
      const clients = await Promise.all(clientIds.map((id) => api.get<RawClient>(`/clients/${id}`)));
      const clientById = new Map(clients.map((c) => [c.id, c]));

      const built: ScheduleSlot[] = [];
      dates.forEach((date, i) => {
        for (const a of dayAppts[i]) {
          const state = statusToState(a.status);
          if (!state) continue;
          const client = clientById.get(a.clientId);
          const durationMin = Math.round((new Date(a.end).getTime() - new Date(a.start).getTime()) / 60000);
          built.push({
            id: a._id,
            date,
            startTime: a.start.slice(11, 16),
            durationMin,
            clientName: client?.name ?? 'Client',
            clientInitials: initials(client?.name ?? 'Client'),
            service: a.services.map((sid) => serviceById.get(sid)?.name ?? 'Service').join(' + '),
            priceTnd: a.price,
            state,
          });
        }
      });
      built.sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)));

      setWeekDates(dates);
      setDayWindows(windows);
      setSlots(built);
    } catch {
      setError('Could not load your schedule.');
    } finally {
      setIsLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data: { weekDates, slots, dayWindows }, isLoading, error, refresh };
}
