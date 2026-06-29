// SWAP: GET /appointments/mine/:id
import { useState } from 'react';
import { staffTodayAppointments, TodayAppointment, TodayState } from '../../data/staff/today';

export function useAppointment(id: string) {
  const found = staffTodayAppointments.find((a) => a.id === id) ?? null;
  const [appointment, setAppointment] = useState<TodayAppointment | null>(found);

  function advanceState() {
    setAppointment((a) => {
      if (!a) return a;
      const next: TodayState =
        a.state === 'waiting' ? 'in_chair' :
        a.state === 'in_chair' ? 'done' : 'done';
      return { ...a, state: next };
    });
  }

  return { data: appointment, isLoading: false, error: null, advanceState };
}
