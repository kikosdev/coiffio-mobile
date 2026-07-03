import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import { salonDateKey, nowAsSalonTime } from '../../utils/salonTime';

export type CaisseEntry = {
  id: string;
  time: string;         // 'HH:mm'
  clientName: string;
  service: string;
  amountTnd: number;
  method: 'cash' | 'card';
};

export type DayCaisse = {
  date: string;         // 'yyyy-MM-dd'
  totalTnd: number;
  servicesTotalTnd: number;
  productsTotalTnd: number;
  cashTnd: number;
  entries: CaisseEntry[];
};

interface RawPaymentLine {
  kind: 'service' | 'product';
  refId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

interface RawPayment {
  _id: string;
  appointmentId?: string;
  items: RawPaymentLine[];
  amount: number;
  method: 'cash' | 'card';
  date: string;
  refunded: boolean;
}

interface RawAppointment {
  clientId: string;
}

interface RawClient {
  id: string;
  name: string;
}

const todayEmpty: DayCaisse = {
  date: salonDateKey(nowAsSalonTime()),
  totalTnd: 0,
  servicesTotalTnd: 0,
  productsTotalTnd: 0,
  cashTnd: 0,
  entries: [],
};

export function useDayCaisse() {
  const staffId = useAuthStore((s) => s.user?.staffId);
  const [data, setData] = useState<DayCaisse>(todayEmpty);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { payments } = await api.get<{ payments: RawPayment[] }>('/caisse/me');
      const active = payments.filter((p) => !p.refunded);

      // Appointment-linked payments get a real client name; walk-in ring-ups (no
      // appointmentId — the "Encaisser" POS flow below) have no client captured at all.
      const apptIds = [...new Set(active.map((p) => p.appointmentId).filter(Boolean) as string[])];
      const appts = await Promise.all(apptIds.map((id) => api.get<RawAppointment>(`/appointments/${id}`)));
      const clientIdByAppt = new Map(apptIds.map((id, i) => [id, appts[i].clientId]));
      const clientIds = [...new Set(Array.from(clientIdByAppt.values()))];
      const clients = await Promise.all(clientIds.map((id) => api.get<RawClient>(`/clients/${id}`)));
      const clientNameById = new Map(clients.map((c) => [c.id, c.name]));

      const entries: CaisseEntry[] = active.map((p) => {
        const clientId = p.appointmentId ? clientIdByAppt.get(p.appointmentId) : undefined;
        return {
          id: p._id,
          time: p.date.slice(11, 16),
          clientName: (clientId && clientNameById.get(clientId)) || 'Walk-in',
          service: p.items.map((i) => i.name).join(' + ') || 'Service',
          amountTnd: p.amount,
          method: p.method,
        };
      }).sort((a, b) => b.time.localeCompare(a.time));

      const servicesTotalTnd = active.reduce((s, p) => s + p.items.filter((i) => i.kind === 'service').reduce((a, i) => a + i.qty * i.unitPrice, 0), 0);
      const productsTotalTnd = active.reduce((s, p) => s + p.items.filter((i) => i.kind === 'product').reduce((a, i) => a + i.qty * i.unitPrice, 0), 0);
      const cashTnd = active.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount, 0);

      setData({
        date: todayEmpty.date,
        totalTnd: servicesTotalTnd + productsTotalTnd,
        servicesTotalTnd,
        productsTotalTnd,
        cashTnd,
        entries,
      });
    } catch {
      setError('Could not load today’s caisse.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Walk-in ring-up — not tied to an appointment, hence no client capture (same as the POS flow). */
  async function addSale(serviceId: string, serviceName: string, amountTnd: number) {
    if (!staffId) return;
    await api.post('/payments', {
      stylistId: staffId,
      items: [{ kind: 'service', refId: serviceId, name: serviceName, qty: 1, unitPrice: amountTnd }],
      method: 'cash',
    });
    await refresh();
  }

  return { data, isLoading, error, addSale, refresh };
}
