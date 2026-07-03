import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';

export type StylistCaisse = { stylistId: string; name: string; gross: number; tips: number; commission: number };

export interface CaisseOverview {
  count: number;
  gross: number;
  tips: number;
  commission: number;
  cashTnd: number;
  cardTnd: number;
  byStylist: StylistCaisse[];
}

interface RawOverview {
  totals: { count: number; gross: number; tips: number; commission: number; byMethod: { cash: number; card: number } };
  byStylist: StylistCaisse[];
}

const empty: CaisseOverview = { count: 0, gross: 0, tips: 0, commission: 0, cashTnd: 0, cardTnd: 0, byStylist: [] };

export function useCaisseOverview() {
  const [data, setData] = useState<CaisseOverview>(empty);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await api.get<RawOverview>('/caisse/overview');
      setData({
        count: raw.totals.count,
        gross: raw.totals.gross,
        tips: raw.totals.tips,
        commission: raw.totals.commission,
        cashTnd: raw.totals.byMethod.cash,
        cardTnd: raw.totals.byMethod.card,
        byStylist: raw.byStylist.sort((a, b) => b.gross - a.gross),
      });
    } catch {
      setError('Could not load the caisse.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
