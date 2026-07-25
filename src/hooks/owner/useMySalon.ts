import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { salonDateKey, nowAsSalonTime } from '../../utils/salonTime';

export type TeamStatus = 'active' | 'off';

export interface OwnerTeamMember {
  id: string;
  name: string;
  initials: string;
  isPro: boolean;
  status: TeamStatus;
  todayCount: number;
}

export interface MySalon {
  id: string;
  name: string;
  address: string;
  hoursToday: string | null; // null = closed today
  isOpen: boolean;
  todayRevenue: number;
  revenueChangePct: number;
  bookingCount: number;
  barbersOn: number;
  barbersTotal: number;
  occupancyPct: number;
  team: OwnerTeamMember[];
}

export function useMySalon() {
  const [salon, setSalon] = useState<MySalon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = salonDateKey(nowAsSalonTime());
      setSalon(await api.get<MySalon>('/owner/hq', { date: today }));
    } catch {
      setError('Could not load salon data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data: salon, isLoading, error, refresh };
}
