import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';

export interface BarberDetail {
  id: string;
  name: string;
  initials: string;
  isPro: boolean;
  weekRevenueTnd: number;
  weekCuts: number;
  weekUtil: { date: string; pct: number }[]; // Mon–Sun
}

interface RawStaff {
  id: string;
  name: string;
  level?: string;
}

interface RawStats {
  weekRevenueTnd: number;
  weekCuts: number;
  weekUtil: { date: string; pct: number }[];
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

export function useBarberDetail(id: string) {
  const [barber, setBarber] = useState<BarberDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [staff, stats] = await Promise.all([
        api.get<RawStaff[]>('/team'),
        api.get<RawStats>(`/team/${id}/stats`),
      ]);
      const me = staff.find((s) => s.id === id);
      if (!me) throw new Error('Not found.');
      setBarber({
        id: me.id,
        name: me.name,
        initials: initials(me.name),
        isPro: me.level === 'master',
        weekRevenueTnd: stats.weekRevenueTnd,
        weekCuts: stats.weekCuts,
        weekUtil: stats.weekUtil,
      });
    } catch {
      setError('Could not load this barber.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data: barber, isLoading, error, refresh };
}
