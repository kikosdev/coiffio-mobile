import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';

export type StaffService = {
  id: string;
  name: string;
  durationMin: number;
  priceTnd: number;
};

interface RawService {
  _id: string;
  name: string;
  price: number;
  durationMin: number;
}

interface RawStanding {
  acceptingBookings: boolean;
}

export function useMyServices() {
  const [services, setServices] = useState<StaffService[]>([]);
  const [acceptingBookings, setAcceptingBookings] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [raw, standing] = await Promise.all([
        api.get<RawService[]>('/services'),
        api.get<RawStanding>('/team/me/standing'),
      ]);
      setServices(raw.map((s) => ({ id: s._id, name: s.name, durationMin: s.durationMin, priceTnd: s.price })));
      setAcceptingBookings(standing.acceptingBookings);
    } catch {
      setError('Could not load services.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggleAcceptingBookings() {
    const next = !acceptingBookings;
    setAcceptingBookings(next); // optimistic
    try {
      await api.patch('/team/me/accepting-bookings', { acceptingBookings: next });
    } catch {
      setAcceptingBookings(!next); // revert on failure
    }
  }

  return { data: { services, acceptingBookings }, isLoading, error, toggleAcceptingBookings };
}
