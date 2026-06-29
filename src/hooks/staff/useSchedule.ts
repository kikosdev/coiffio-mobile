// SWAP: GET /schedule?staffId=me&weekStart=...
import { scheduleSlots, scheduleWeekDates } from '../../data/staff/schedule';

export function useSchedule() {
  return {
    data: { weekDates: scheduleWeekDates, slots: scheduleSlots },
    isLoading: false,
    error: null,
  };
}
