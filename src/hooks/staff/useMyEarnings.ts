// SWAP: GET /earnings/mine?period=week|month|year
import { earningsByPeriod, EarningPeriod } from '../../data/staff/earnings';

export function useMyEarnings(period: EarningPeriod) {
  return { data: earningsByPeriod[period], isLoading: false, error: null };
}
