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

function mondayOfThisWeek(): Date {
  const now = nowAsSalonTime(); // real Africa/Tunis "today", not the device's raw UTC day
  const dow = (now.getUTCDay() + 6) % 7; // 0=Mon
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow));
  return monday;
}

interface StaffScheduleWeekResponse {
  weekDates: string[];
  dayWindows: Record<string, DayWindow>;
  slots: Array<{
    id: string;
    date: string;
    startTime: string;
    durationMin: number;
    clientName: string;
    clientInitials: string;
    services: { name: string }[];
    totalTnd: number;
    state: 'waiting' | 'in_chair' | 'done';
  }>;
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
      const startDate = monday.toISOString().slice(0, 10);
      const data = await api.get<StaffScheduleWeekResponse>('/staff/schedule/week', { startDate });
      const built: ScheduleSlot[] = data.slots.map((slot) => ({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        durationMin: slot.durationMin,
        clientName: slot.clientName,
        clientInitials: slot.clientInitials,
        service: slot.services.map((s) => s.name).join(' + '),
        priceTnd: slot.totalTnd,
        state: slot.state === 'done' ? 'completed' : 'confirmed',
      }));
      built.sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)));

      setWeekDates(data.weekDates);
      setDayWindows(data.dayWindows);
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
