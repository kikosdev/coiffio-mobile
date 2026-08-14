import { useEffect } from 'react';
import { useOwnerSalonStore } from '../../stores/ownerSalon';
import { MySalon, OwnerTeamMember } from '../../types/owner';

export type { MySalon, OwnerTeamMember };

/**
 * Reads the shared ownerSalon store (src/stores/ownerSalon.ts) instead of fetching GET
 * /owner/hq itself — hq.tsx, salons.tsx, salon/[id].tsx and team.tsx all call this hook, and
 * previously each one triggered its own request. The store dedupes across all of them.
 */
export function useMySalon() {
  const salon = useOwnerSalonStore((s) => s.salon);
  const status = useOwnerSalonStore((s) => s.status);
  const error = useOwnerSalonStore((s) => s.error);
  const fetchHQ = useOwnerSalonStore((s) => s.fetchHQ);
  const refresh = useOwnerSalonStore((s) => s.refresh);

  useEffect(() => {
    fetchHQ();
  }, [fetchHQ]);

  return {
    data: salon,
    isLoading: status === 'idle' || status === 'loading',
    error: status === 'error' ? (error ?? 'Could not load salon data.') : null,
    refresh,
  };
}
