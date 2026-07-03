import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';

export type StaffClientVisit = {
  serviceName: string;
  date: string;       // 'yyyy-MM-dd'
  priceTnd: number;
};

export type StaffClient = {
  id: string;
  name: string;
  initials: string;
  isRegular: boolean;
  visitCount: number;
  lastVisitDate: string | null;  // 'yyyy-MM-dd' — null if never completed a visit
  totalSpentTnd: number;
  phone: string;
  notes?: string;
  recentVisits: StaffClientVisit[];
};

interface RawClientListItem {
  id: string;
  name: string;
  phone: string;
  notes: string;
  visitCount: number;
  totalSpentTnd: number;
  lastVisitDate: string | null;
}

interface RawClientDetail extends RawClientListItem {
  recentVisits: StaffClientVisit[];
}

const REGULAR_THRESHOLD = 5;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function toStaffClient(c: RawClientListItem, recentVisits: StaffClientVisit[] = []): StaffClient {
  return {
    id: c.id,
    name: c.name,
    initials: initials(c.name),
    isRegular: c.visitCount >= REGULAR_THRESHOLD,
    visitCount: c.visitCount,
    lastVisitDate: c.lastVisitDate,
    totalSpentTnd: c.totalSpentTnd,
    phone: c.phone,
    notes: c.notes || undefined,
    recentVisits,
  };
}

export function useMyClients(search: string = '') {
  const [clients, setClients] = useState<StaffClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await api.get<RawClientListItem[]>('/clients', search ? { q: search } : undefined);
      setClients(raw.map((c) => toStaffClient(c)));
    } catch {
      setError('Could not load clients.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // "This week" = visited within the last 7 days — there's no client-signup-date stat exposed
  // by the API today, so this counts recent activity rather than "new" clients.
  const now = Date.now();
  const stats = {
    total: clients.length,
    regulars: clients.filter((c) => c.isRegular).length,
    thisWeek: clients.filter((c) => c.lastVisitDate && now - new Date(c.lastVisitDate).getTime() <= WEEK_MS).length,
  };

  return { data: { clients, stats }, isLoading, error, refresh };
}

export function useMyClient(id: string) {
  const [client, setClient] = useState<StaffClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    api
      .get<RawClientDetail>(`/clients/${id}`)
      .then((raw) => {
        if (!cancelled) setClient(toStaffClient(raw, raw.recentVisits));
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this client.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { data: client, isLoading, error };
}
