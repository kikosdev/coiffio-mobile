import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';

export type EarningPeriod = 'week' | 'month' | 'year';

export type ByService = { service: string; totalTnd: number; count: number; pct: number };
export type ChartBar  = { label: string; valueTnd: number; isToday?: boolean };

export type EarningsData = {
  period: EarningPeriod;
  totalTnd: number;
  changePct: number;
  byService: ByService[];
  chartBars: ChartBar[];
};

interface RawEarnings {
  period: EarningPeriod;
  totalTnd: number;
  changePct: number;
  byService: ByService[];
  chartBars: { bucket: string; valueTnd: number }[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // getUTCDay() index 0=Sun

/** Backend only returns buckets that had a payment — backfill the full period's bars with
 * zeros so the chart always shows a complete week/month/year, matching the UI's expectations. */
function buildChartBars(period: EarningPeriod, raw: { bucket: string; valueTnd: number }[]): ChartBar[] {
  const byBucket = new Map(raw.map((b) => [b.bucket, b.valueTnd]));
  const now = new Date();

  if (period === 'week') {
    const bars: ChartBar[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      bars.push({ label: DAY_LABELS[d.getUTCDay()], valueTnd: byBucket.get(key) ?? 0, isToday: i === 0 });
    }
    return bars;
  }

  if (period === 'year') {
    const year = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    return MONTH_LABELS.map((label, i) => ({
      label,
      valueTnd: byBucket.get(`${year}-${String(i + 1).padStart(2, '0')}`) ?? 0,
      isToday: i === currentMonth,
    }));
  }

  // month: bucket keys are 'W1'..'W5' (day-of-month / 7, ceil'd — matches the backend).
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const weekCount = Math.ceil(daysInMonth / 7);
  const currentWeek = Math.ceil(now.getUTCDate() / 7);
  return Array.from({ length: weekCount }, (_, i) => {
    const key = `W${i + 1}`;
    return { label: key, valueTnd: byBucket.get(key) ?? 0, isToday: i + 1 === currentWeek };
  });
}

export function useMyEarnings(period: EarningPeriod) {
  const [data, setData] = useState<EarningsData>({ period, totalTnd: 0, changePct: 0, byService: [], chartBars: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await api.get<RawEarnings>('/earnings/me', { period });
      setData({ period: raw.period, totalTnd: raw.totalTnd, changePct: raw.changePct, byService: raw.byService, chartBars: buildChartBars(period, raw.chartBars) });
    } catch {
      setError('Could not load earnings.');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
