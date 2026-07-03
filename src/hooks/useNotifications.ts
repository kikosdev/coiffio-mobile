import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatSalonTime } from '../utils/salonTime';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  date: string; // ISO
  read: boolean;
};

interface RawNotification {
  _id: string;
  type: string;
  title?: string;
  body?: string;
  payload?: Record<string, unknown>;
  date: string;
  read: boolean;
}

// Per-user notifications (dispatch()) don't carry precomputed title/body — only the
// shared POS broadcast feed (dispatchOnce()) does — so derive readable text from `type`.
function describe(n: RawNotification): { title: string; body: string } {
  if (n.title || n.body) return { title: n.title ?? 'Notification', body: n.body ?? '' };

  const start = typeof n.payload?.start === 'string' ? n.payload.start : undefined;
  const time = start ? formatSalonTime(start) : null;

  switch (n.type) {
    case 'appointment.created':
      return { title: 'New appointment', body: time ? `Booked for ${time}` : '' };
    case 'appointment.cancelled':
      return { title: 'Appointment cancelled', body: time ? `Was booked for ${time}` : '' };
    case 'order.created':
      return { title: 'New order', body: '' };
    case 'stock.low':
      return { title: 'Low stock', body: '' };
    case 'stock.out':
      return { title: 'Out of stock', body: '' };
    case 'sale.recorded':
      return { title: 'Sale recorded', body: '' };
    case 'leave.requested':
      return { title: 'Leave request', body: '' };
    default:
      return { title: n.type, body: '' };
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await api.get<RawNotification[]>('/notifications');
      setNotifications(raw.map((n) => ({ id: n._id, ...describe(n), date: n.date, read: n.read })));
    } catch {
      setError('Could not load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch {
      // best-effort — leave the optimistic update in place
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.post('/notifications/read-all');
    } catch {
      // best-effort
    }
  }

  return { notifications, unreadCount, isLoading, error, refresh, markRead, markAllRead };
}
