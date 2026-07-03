import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';

export type StaffRevenue = { name: string; revenue: number; pct: number };
export type TopBarber = { rank: number; name: string; initials: string; revenue: number };

export interface AnalyticsData {
  monthRevenue: number;
  revenueChangePct: number;
  byStaff: StaffRevenue[];
  topBarbers: TopBarber[];
}

interface RawReport {
  revenue: number;
  revenueChangePct: number;
  byStylist: { stylistId: string; name: string; revenue: number }[];
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData>({ monthRevenue: 0, revenueChangePct: 0, byStaff: [], topBarbers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await api.get<RawReport>('/reports', { period: 'month' });
      const maxRevenue = Math.max(1, ...raw.byStylist.map((s) => s.revenue));
      setData({
        monthRevenue: raw.revenue,
        revenueChangePct: raw.revenueChangePct,
        byStaff: raw.byStylist.map((s) => ({ name: s.name, revenue: s.revenue, pct: Math.round((s.revenue / maxRevenue) * 100) })),
        topBarbers: raw.byStylist.slice(0, 3).map((s, i) => ({ rank: i + 1, name: s.name, initials: initials(s.name), revenue: s.revenue })),
      });
    } catch {
      setError('Could not load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
