// SWAP: GET /appointments/mine?date=today&assigned=me
import { useState } from 'react';
import { staffTodayAppointments, todayDate, TodayAppointment, TodayState } from '../../data/staff/today';

export function useTodayBoard() {
  const [appointments, setAppointments] = useState<TodayAppointment[]>(staffTodayAppointments);

  function advanceState(id: string) {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next: TodayState =
          a.state === 'waiting' ? 'in_chair' :
          a.state === 'in_chair' ? 'done' : 'done';
        return { ...a, state: next };
      }),
    );
  }

  return { data: { date: todayDate, appointments }, isLoading: false, error: null, advanceState };
}
