import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/auth';

export type StaffProfileData = {
  id: string;
  name: string;
  initials: string;
  isPro: boolean;
  stats: { clients: number; cuts: number };
};

interface RawStanding {
  stylistId: string;
  level: string;
  completedCount: number;
}

interface RawClient {
  id: string;
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

export function useMyProfile() {
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<StaffProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [standing, clients] = await Promise.all([
        api.get<RawStanding>('/team/me/standing'),
        api.get<RawClient[]>('/clients'),
      ]);
      setProfile({
        id: standing.stylistId,
        name: user.name,
        initials: initials(user.name),
        isPro: standing.level === 'master',
        stats: { clients: clients.length, cuts: standing.completedCount },
      });
    } catch {
      setError('Could not load your profile.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data: profile, isLoading, error, refresh };
}
