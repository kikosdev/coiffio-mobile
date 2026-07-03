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

interface RawPublicSalon {
  id: string;
  name: string;
  address: string;
  isOpen: boolean | null;
}

interface RawBusinessHour {
  day: number;
  isOpen: boolean;
  start: string;
  end: string;
}

interface RawOverview {
  kpis: {
    revenue: number;
    revenueChangePct: number;
    appointments: { booked: number; done: number; noShow: number };
    occupancyPct: number;
    barbersOn: number;
    barbersTotal: number;
  };
}

interface RawStaff {
  id: string;
  name: string;
  level?: string;
}

interface RawAppointment {
  stylistId: string;
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
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
      const [salons, hours, overview, staff, todayAppts] = await Promise.all([
        api.get<RawPublicSalon[]>('/public/salons'),
        api.get<RawBusinessHour[]>('/schedule/salon-hours'),
        api.get<RawOverview>('/overview'),
        api.get<RawStaff[]>('/team'),
        api.get<RawAppointment[]>('/appointments', { date: today }),
      ]);

      const base = salons[0];
      if (!base) throw new Error('No salon found.');

      const todayWeekday = new Date(`${today}T00:00:00.000Z`).getUTCDay();
      const todayHours = hours.find((h) => h.day === todayWeekday);

      const countByStylist = new Map<string, number>();
      for (const a of todayAppts) {
        countByStylist.set(a.stylistId, (countByStylist.get(a.stylistId) ?? 0) + 1);
      }

      // "active vs off" = has a booking today or not — there's no live clock-in/break signal
      // in the data model, so this is a same-day-activity proxy, not a real-time chair status.
      const team: OwnerTeamMember[] = staff.map((s) => {
        const todayCount = countByStylist.get(s.id) ?? 0;
        return {
          id: s.id,
          name: s.name,
          initials: initials(s.name),
          isPro: s.level === 'master',
          status: todayCount > 0 ? 'active' : 'off',
          todayCount,
        };
      });

      const { kpis } = overview;
      setSalon({
        id: base.id,
        name: base.name,
        address: base.address,
        hoursToday: todayHours?.isOpen ? `${todayHours.start}–${todayHours.end}` : null,
        isOpen: base.isOpen ?? false,
        todayRevenue: kpis.revenue,
        revenueChangePct: kpis.revenueChangePct,
        bookingCount: kpis.appointments.booked + kpis.appointments.done + kpis.appointments.noShow,
        barbersOn: kpis.barbersOn,
        barbersTotal: kpis.barbersTotal,
        occupancyPct: kpis.occupancyPct,
        team,
      });
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
